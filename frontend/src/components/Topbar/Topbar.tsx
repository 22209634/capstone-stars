import './Topbar.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import TelescopeConnectionModal from '@/components/TelescopeConnectionModal/TelescopeConnectionModal'
import { Camera, Telescope, Wifi } from 'lucide-react'
import { useState } from 'react'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import telescopeAPI, { type AscomDevice } from '@/services/telescopeAPI'

export default function Topbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const { connectionMode, setConnectionMode, connectedDevice, setConnectedDevice } = useTelescopeContext();

    const handleConnect = async (device: AscomDevice) => {
        setIsConnecting(true);
        try {
            const response = await telescopeAPI.connectToAscomDevice(
                device.uniqueID,
                device.ipAddress,
                device.port,
                device.deviceNumber
            );

            if (response.success) {
                setConnectionMode('ascom');
                setConnectedDevice(device.deviceName);
            } else {
                alert(`Failed to connect: ${response.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to telescope. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await telescopeAPI.disconnectAscom();
            setConnectionMode('simulation');
            setConnectedDevice(null);
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    };

    return (
        <>
            <Panel className="topbar__panel" borderRadius="3px">
                <div className="topbar__items-wrapper">
                    <h1 className="logo">STARS System v0.1</h1>
                    <StatusLine />
                    <div className="topbar-right">
                        <input type="text" placeholder=" Search..." />

                        {connectionMode === 'simulation' ? (
                            <Button
                                className="telescope-connect-btn"
                                onClick={() => setIsModalOpen(true)}
                                disabled={isConnecting}
                            >
                                <Telescope size={18} />
                                Connect to Telescope
                            </Button>
                        ) : (
                            <div className="connection-status">
                                <Button
                                    className="telescope-connected-btn"
                                    onClick={handleDisconnect}
                                >
                                    <Wifi size={18} />
                                    {connectedDevice || 'Connected'}
                                </Button>
                            </div>
                        )}

                        <Button className="capture-btn"><Camera /> Capture</Button>
                    </div>
                </div>
            </Panel>

            <TelescopeConnectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnect={handleConnect}
            />
        </>
    )
}