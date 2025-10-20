"""
ASCOM Alpaca telescope integration service.
This module handles discovery and communication with ASCOM Alpaca telescopes.
"""

import asyncio
import aiohttp
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class AscomDevice:
    """Represents an ASCOM Alpaca device."""

    def __init__(self, device_name: str, device_type: str, device_number: int,
                 unique_id: str, ip_address: str, port: int):
        self.device_name = device_name
        self.device_type = device_type
        self.device_number = device_number
        self.unique_id = unique_id
        self.ip_address = ip_address
        self.port = port

    def to_dict(self) -> Dict:
        return {
            "deviceName": self.device_name,
            "deviceType": self.device_type,
            "deviceNumber": self.device_number,
            "uniqueID": self.unique_id,
            "ipAddress": self.ip_address,
            "port": self.port
        }


class AscomAlpacaClient:
    """Client for communicating with ASCOM Alpaca devices."""

    def __init__(self):
        self.connected_device: Optional[AscomDevice] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.base_url: Optional[str] = None

    async def discover_devices(self, timeout: int = 5) -> List[AscomDevice]:
        """
        Discover ASCOM Alpaca devices on the local network using UDP broadcast
        and direct localhost probing.

        Args:
            timeout: Discovery timeout in seconds

        Returns:
            List of discovered AscomDevice objects
        """
        devices = []
        discovered_addresses = set()

        # First, try common localhost ports directly (UDP broadcast doesn't work well with localhost)
        localhost_ports = [11111, 32323, 5555, 8000, 80]
        logger.info("Checking localhost for ASCOM Alpaca devices...")

        for port in localhost_ports:
            try:
                device_list = await self._query_device_info('127.0.0.1', port)
                for device in device_list:
                    address_key = f"{device.ip_address}:{device.port}:{device.device_number}"
                    if address_key not in discovered_addresses:
                        discovered_addresses.add(address_key)
                        devices.append(device)
                        logger.info(f"Found device on localhost:{port} - {device.device_name}")
            except Exception as e:
                # Silently skip ports that don't respond
                pass

        # Standard ASCOM Alpaca discovery port
        discovery_port = 32227

        try:
            # Create UDP socket for network discovery
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.settimeout(1.0)  # Shorter timeout for UDP

            # Send discovery message
            discovery_message = b"alpacadiscovery1"
            sock.sendto(discovery_message, ('<broadcast>', discovery_port))

            # Collect responses
            end_time = asyncio.get_event_loop().time() + 1.0
            while asyncio.get_event_loop().time() < end_time:
                try:
                    data, addr = sock.recvfrom(1024)
                    response = data.decode('utf-8')

                    # Parse response (format: "alpacaport:<port>")
                    if response.startswith('alpacaport:'):
                        port = int(response.split(':')[1])
                        ip_address = addr[0]

                        # Query device for more information
                        device_list = await self._query_device_info(ip_address, port)
                        for device in device_list:
                            address_key = f"{device.ip_address}:{device.port}:{device.device_number}"
                            if address_key not in discovered_addresses:
                                discovered_addresses.add(address_key)
                                devices.append(device)
                                logger.info(f"Found device via UDP - {device.device_name}")

                except socket.timeout:
                    break
                except Exception as e:
                    logger.error(f"Error processing discovery response: {e}")

            sock.close()

        except Exception as e:
            logger.error(f"UDP Discovery error: {e}")

        logger.info(f"Discovery complete. Found {len(devices)} device(s)")
        return devices

    async def _query_device_info(self, ip_address: str, port: int) -> List[AscomDevice]:
        """Query an ASCOM Alpaca server for available devices."""
        devices = []
        base_url = f"http://{ip_address}:{port}"

        try:
            timeout = aiohttp.ClientTimeout(total=2)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                # Get management API info
                url = f"{base_url}/management/v1/configureddevices"
                logger.debug(f"Querying {url}")

                async with session.get(url) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        logger.debug(f"Response from {ip_address}:{port} - {data}")

                        for device_info in data.get('Value', []):
                            device_type = device_info.get('DeviceType', '').lower()
                            logger.debug(f"Found device type: {device_type}")

                            if device_type == 'telescope':
                                device = AscomDevice(
                                    device_name=device_info.get('DeviceName', 'Unknown Telescope'),
                                    device_type=device_info.get('DeviceType', 'Telescope'),
                                    device_number=device_info.get('DeviceNumber', 0),
                                    unique_id=device_info.get('UniqueID', ''),
                                    ip_address=ip_address,
                                    port=port
                                )
                                devices.append(device)
                                logger.info(f"Added telescope: {device.device_name}")
                    else:
                        logger.debug(f"HTTP {resp.status} from {ip_address}:{port}")

        except asyncio.TimeoutError:
            logger.debug(f"Timeout querying {ip_address}:{port}")
        except Exception as e:
            logger.debug(f"Error querying device at {ip_address}:{port}: {e}")

        return devices

    async def connect(self, device: AscomDevice) -> bool:
        """
        Connect to an ASCOM Alpaca telescope.

        Args:
            device: AscomDevice to connect to

        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.connected_device = device
            self.base_url = f"http://{device.ip_address}:{device.port}/api/v1/telescope/{device.device_number}"

            # Create persistent session
            if self.session:
                await self.session.close()
            self.session = aiohttp.ClientSession()

            # Set connected flag - ASCOM Alpaca requires form data, not JSON
            form_data = aiohttp.FormData()
            form_data.add_field('Connected', 'true')
            form_data.add_field('ClientID', '1')
            form_data.add_field('ClientTransactionID', '1')

            async with self.session.put(
                f"{self.base_url}/connected",
                data=form_data
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info(f"Connected to {device.device_name}: {result}")
                    return True
                else:
                    error_text = await resp.text()
                    logger.error(f"Failed to connect: HTTP {resp.status} - {error_text}")
                    return False

        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False

    async def disconnect(self) -> bool:
        """Disconnect from the current telescope."""
        if not self.connected_device or not self.session:
            return True

        try:
            form_data = aiohttp.FormData()
            form_data.add_field('Connected', 'false')
            form_data.add_field('ClientID', '1')
            form_data.add_field('ClientTransactionID', '1')

            async with self.session.put(
                f"{self.base_url}/connected",
                data=form_data
            ) as resp:
                await self.session.close()
                self.session = None
                self.connected_device = None
                self.base_url = None
                logger.info("Disconnected from telescope")
                return True

        except Exception as e:
            logger.error(f"Disconnect error: {e}")
            return False

    async def get_status(self) -> Dict:
        """Get current telescope status."""
        if not self.session or not self.base_url:
            raise Exception("Not connected to telescope")

        try:
            # Get various status properties
            async with self.session.get(f"{self.base_url}/rightascension") as resp:
                ra_data = await resp.json()
                ra = ra_data.get('Value', 0)

            async with self.session.get(f"{self.base_url}/declination") as resp:
                dec_data = await resp.json()
                dec = dec_data.get('Value', 0)

            async with self.session.get(f"{self.base_url}/altitude") as resp:
                alt_data = await resp.json()
                alt = alt_data.get('Value', 0)

            async with self.session.get(f"{self.base_url}/azimuth") as resp:
                az_data = await resp.json()
                az = az_data.get('Value', 0)

            async with self.session.get(f"{self.base_url}/tracking") as resp:
                tracking_data = await resp.json()
                tracking = tracking_data.get('Value', False)

            async with self.session.get(f"{self.base_url}/slewing") as resp:
                slewing_data = await resp.json()
                slewing = slewing_data.get('Value', False)

            # Convert RA from hours to degrees (ASCOM returns hours, we use degrees)
            ra_degrees = ra * 15.0  # 1 hour = 15 degrees

            return {
                "connected": True,
                "tracking": tracking,
                "slewing": slewing,
                "rightAscension": ra_degrees,
                "declination": dec,
                "altitude": alt,
                "azimuth": az,
                "timestamp": ""
            }

        except Exception as e:
            logger.error(f"Error getting status: {e}")
            raise

    async def slew_to_coordinates(self, ra: float, dec: float) -> bool:
        """
        Slew telescope to specified coordinates.
        Args:
            ra: Right Ascension in degrees (0-360)
            dec: Declination in degrees (-90 to +90)
        """
        if not self.session or not self.base_url:
            raise Exception("Not connected to telescope")

        try:
            # Convert RA from degrees to hours for ASCOM (ASCOM expects hours)
            ra_hours = ra / 15.0  # 15 degrees = 1 hour

            form_data = aiohttp.FormData()
            form_data.add_field('RightAscension', str(ra_hours))
            form_data.add_field('Declination', str(dec))
            form_data.add_field('ClientID', '1')
            form_data.add_field('ClientTransactionID', '1')

            async with self.session.put(
                f"{self.base_url}/slewtocoordinatesasync",
                data=form_data
            ) as resp:
                result = await resp.json()
                if resp.status == 200:
                    # Check for ASCOM errors in response
                    if result.get('ErrorNumber', 0) != 0:
                        error_msg = result.get('ErrorMessage', 'Unknown error')
                        logger.error(f"ASCOM error during slew: {error_msg} (Error #{result.get('ErrorNumber')})")
                        return False
                    logger.info(f"Slewing to RA={ra_hours:.4f}h ({ra:.2f}°), Dec={dec:.2f}°")
                    return True
                else:
                    logger.error(f"HTTP error during slew: {resp.status} - {await resp.text()}")
                return resp.status == 200

        except Exception as e:
            logger.error(f"Slew error: {e}")
            return False

    async def set_tracking(self, enabled: bool) -> bool:
        """Enable or disable telescope tracking."""
        if not self.session or not self.base_url:
            raise Exception("Not connected to telescope")

        try:
            form_data = aiohttp.FormData()
            form_data.add_field('Tracking', 'true' if enabled else 'false')
            form_data.add_field('ClientID', '1')
            form_data.add_field('ClientTransactionID', '1')

            async with self.session.put(
                f"{self.base_url}/tracking",
                data=form_data
            ) as resp:
                return resp.status == 200

        except Exception as e:
            logger.error(f"Tracking error: {e}")
            return False

    async def abort_slew(self) -> bool:
        """Abort current slew operation."""
        if not self.session or not self.base_url:
            raise Exception("Not connected to telescope")

        try:
            form_data = aiohttp.FormData()
            form_data.add_field('ClientID', '1')
            form_data.add_field('ClientTransactionID', '1')

            async with self.session.put(
                f"{self.base_url}/abortslew",
                data=form_data
            ) as resp:
                return resp.status == 200

        except Exception as e:
            logger.error(f"Abort error: {e}")
            return False


# Global client instance
ascom_client = AscomAlpacaClient()