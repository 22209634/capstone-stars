import './Topbar.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import { Camera } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
    const [capturing, setCapturing] = useState(false)

    const handleCapture = async () => {
        if (capturing) return

        setCapturing(true)
        try {
            const response = await fetch('http://localhost:8000/api/camera/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exposureTime: 1.0,
                    targetName: null
                })
            })

            const result = await response.json()

            if (result.success) {
                console.log('Image captured:', result.data.filename)
                // You could show a success notification here
                alert(`Image captured: ${result.data.filename}`)
            } else {
                console.error('Capture failed:', result.message)
                alert(`Capture failed: ${result.message}`)
            }
        } catch (error) {
            console.error('Capture error:', error)
            alert('Capture error: Check if telescope server is running')
        } finally {
            setCapturing(false)
        }
    }

    return (
        <Panel className="topbar__panel" borderRadius="3px">
            <div className="topbar__items-wrapper">
                <h1 className="logo">STARS System v0.1</h1>
                <StatusLine />
                <div className="topbar-right">
                    <input type="text" placeholder=" Search..." />
                    <Button
                        className="capture-btn"
                        onClick={handleCapture}
                        disabled={capturing}
                    >
                        <Camera /> {capturing ? 'Capturing...' : 'Capture'}
                    </Button>
                    {/* <button className="menu-btn"><Menu/> Menu</button> */}
                </div>
            </div>
        </Panel>
    )
}