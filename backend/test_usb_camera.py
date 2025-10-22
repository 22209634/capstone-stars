"""
Quick test script to check USB camera detection on Windows
"""
import cv2
import sys

print("Testing USB camera detection on Windows...")
print("=" * 50)

found_cameras = []

for camera_id in range(10):
    print(f"\nTrying camera ID {camera_id}...", end=" ")

    # Try DirectShow backend (Windows default)
    cap = cv2.VideoCapture(camera_id, cv2.CAP_DSHOW)

    if cap.isOpened():
        print("OK - FOUND")

        # Try to get camera properties
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        fps = cap.get(cv2.CAP_PROP_FPS)

        print(f"  Resolution: {int(width)}x{int(height)}")
        print(f"  FPS: {fps}")

        # Try to capture a frame
        ret, frame = cap.read()
        if ret:
            print(f"  Frame capture: SUCCESS (shape: {frame.shape})")
            found_cameras.append(camera_id)
        else:
            print(f"  Frame capture: FAILED")

        cap.release()
    else:
        print("X - Not found")
        cap.release()

print("\n" + "=" * 50)
print(f"\nSummary: Found {len(found_cameras)} working camera(s)")
if found_cameras:
    print(f"Camera IDs: {found_cameras}")
else:
    print("\nNo cameras detected!")
    print("\nTroubleshooting tips:")
    print("1. Make sure your camera is connected and working in Windows Camera app")
    print("2. Close any apps using the camera (Teams, Zoom, Camera app, etc.)")
    print("3. Try unplugging and replugging the camera")
    print("4. Check Windows Device Manager for camera driver issues")
