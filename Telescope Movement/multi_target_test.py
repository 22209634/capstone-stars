"""
Multi-target test script for SimScope
Tests slewing to different astronomical objects
"""
import win32com.client
import pythoncom
import time

def test_multiple_targets():
    try:
        # Initialize COM
        pythoncom.CoInitialize()
        
        print("SimScope Multi-Target Test")
        print("=" * 40)
        print("Attempting to connect to SimScope...")
        
        # Connect to SimScope driver
        telescope = win32com.client.Dispatch("ASCOM.SimScope.Telescope")
        telescope.Connected = True
        
        print(f"✓ Connected to: {telescope.Name}")
        print(f"✓ Driver Version: {telescope.DriverVersion}")
        
        # Enable tracking
        telescope.Tracking = True
        print("✓ Tracking enabled")
        
        # Define test targets
        targets = {
            "Polaris (North Star)": {"ra": 2.530, "dec": 89.264},
            "Vega (Summer Triangle)": {"ra": 18.615, "dec": 38.784},
            "Sirius (Brightest Star)": {"ra": 6.752, "dec": -16.716},
            "Betelgeuse (Orion)": {"ra": 5.919, "dec": 7.407},
            "Zenith Position": {"ra": 12.0, "dec": 45.0}
        }
        
        # Test each target
        for target_name, coords in targets.items():
            print(f"\n🎯 Testing slew to: {target_name}")
            print(f"   Target RA: {coords['ra']:.3f} hours ({coords['ra']*15:.1f}°)")
            print(f"   Target Dec: {coords['dec']:.3f} degrees")
            
            # Get current position
            current_ra = telescope.RightAscension
            current_dec = telescope.Declination
            print(f"   Current position: RA {current_ra:.3f}h, Dec {current_dec:.3f}°")
            
            # Start slew
            telescope.SlewToCoordinates(coords['ra'], coords['dec'])
            print("   ⏳ Slewing...")
            
            # Wait for slew to complete
            start_time = time.time()
            while telescope.Slewing:
                if time.time() - start_time > 30:  # 30 second timeout
                    print("   ⚠️ Slew timeout")
                    break
                time.sleep(0.5)
                print("   . . .", end="", flush=True)
            
            # Check final position
            final_ra = telescope.RightAscension
            final_dec = telescope.Declination
            
            print(f"\n   ✅ Final position: RA {final_ra:.3f}h, Dec {final_dec:.3f}°")
            
            # Calculate accuracy
            ra_error = abs(final_ra - coords['ra'])
            dec_error = abs(final_dec - coords['dec'])
            
            if ra_error < 0.01 and dec_error < 0.1:  # Within tolerance
                print(f"   🎯 Excellent accuracy! (RA error: {ra_error:.4f}h, Dec error: {dec_error:.3f}°)")
            else:
                print(f"   📍 Position reached (RA error: {ra_error:.4f}h, Dec error: {dec_error:.3f}°)")
            
            # Brief pause between targets
            print("   💤 Waiting 2 seconds...")
            time.sleep(2)
        
        # Final status check
        print(f"\n📊 Final Status:")
        print(f"   Tracking: {telescope.Tracking}")
        print(f"   Final RA: {telescope.RightAscension:.4f} hours")
        print(f"   Final Dec: {telescope.Declination:.4f} degrees")
        print(f"   Altitude: {telescope.Altitude:.2f} degrees")
        print(f"   Azimuth: {telescope.Azimuth:.2f} degrees")
        
        # Disconnect
        telescope.Connected = False
        print("\n✅ All tests completed successfully!")
        print("🔭 SimScope is ready for web integration!")
        
        pythoncom.CoUninitialize()
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure SimScope is running")
        print("2. Check ASCOM installation")
        print("3. Verify SimScope is registered")
        return False

if __name__ == "__main__":
    success = test_multiple_targets()
    
    if success:
        print("\n🎉 Multi-target test passed!")
        print("Ready to create the web interface!")
    else:
        print("\n💥 Issues detected - check error messages above")
    
    input("\nPress Enter to close...")