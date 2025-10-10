import './TelescopeView.css';
// import { useEffect, useRef, useState } from 'react';
// import { initStellarium } from '@/services/stellariumManager';
// import { setGlobalStellarium } from '@/hooks/useStellarium';

export default function TelescopeView() {
    // const canvasRef = useRef<HTMLCanvasElement>(null);
    // const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     if (!canvasRef.current) return;

    //     initStellarium(canvasRef.current, (stel) => {
    //         setGlobalStellarium(stel); // Store globally
    //         setLoading(false);
    //         console.log('Telescope ready!');
    //     });
    // }, []); // Empty dependency array - no flickering

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#0a0a0a' }}>
            {/* Sky simulation commented out - replaced with camera live view */}
            {/* <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            /> */}

            {/* {loading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '18px'
                }}>
                    Loading telescope...
                </div>
            )} */}

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                fontSize: '16px',
                textAlign: 'center'
            }}>
                Sky Simulation Disabled
                <br />
                <span style={{ fontSize: '14px' }}>Camera Live View will appear here</span>
            </div>
        </div>
    );
}