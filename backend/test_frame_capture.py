"""
Test USB camera frame capture endpoint
"""
import sys
sys.path.insert(0, '.')

from app.services.usb_camera import usb_camera_service

print("Testing USB camera frame capture...")
print("=" * 50)

# Connect to camera 0
print("\n1. Connecting to camera 0...")
success = usb_camera_service.connect(0)
print(f"   Connection: {'SUCCESS' if success else 'FAILED'}")

if success:
    # Try to capture a frame
    print("\n2. Capturing frame...")
    frame_data = usb_camera_service.capture_frame()

    if frame_data:
        print(f"   Frame captured: {len(frame_data)} bytes")
        print(f"   Frame type: {type(frame_data)}")

        # Try to save it
        with open('test_frame.jpg', 'wb') as f:
            f.write(frame_data)
        print("   Saved to test_frame.jpg")
    else:
        print("   FAILED to capture frame")

    # Disconnect
    print("\n3. Disconnecting...")
    usb_camera_service.disconnect()
    print("   Disconnected")
else:
    print("\nCould not connect to camera")

print("\n" + "=" * 50)
