import './Topbar.css'
import Panel from '@/components/Panel/Panel.tsx'
import Button from '@/components/Button/Button.tsx'
import StatusLine from '@/components/Topbar/StatusLine/StatusLine.tsx'
import { Camera } from 'lucide-react'

export default function Topbar() {
    return (
        <Panel className="topbar__panel" borderRadius="3px">
            <div className="topbar__items-wrapper">
                <h1 className="logo">STARS System v0.1</h1>
                <StatusLine />
                <div className="topbar-right">
                    <input type="text" placeholder=" Search..." />
                    <Button className="capture-btn"><Camera /> Capture</Button>
                    {/* <button className="menu-btn"><Menu/> Menu</button> */}
                </div>
            </div>
        </Panel>
    )
}