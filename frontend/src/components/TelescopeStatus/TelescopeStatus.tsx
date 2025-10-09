import './TelescopeStatus.css'
import Panel from '@/components/Panel/Panel.tsx'
import { useTelescopeContext } from '@/contexts/TelescopeContext'
import { degreesToHMS, degreesToDMS } from '@/utils/coordinateUtils'

export default function TelescopeStatus() {
    const { ra, dec, status } = useTelescopeContext();

    // Format RA and Dec to HMS/DMS format
    const formattedRa = degreesToHMS(ra);
    const formattedDec = degreesToDMS(dec);

    return (
        <div className="telescope-status__wrapper">
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>Status</span> {status}</p>
                </div>
            </Panel>
            <Panel className="telescope-status__panel" borderRadius="3px">
                <div className="telescope-status__item">
                    <p><span>RA</span> {formattedRa}</p>
                    <p><span>Dec</span> {formattedDec}</p>
                </div>
            </Panel>
        </div>
    )
}