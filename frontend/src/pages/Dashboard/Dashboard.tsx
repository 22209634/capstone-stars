import './Dashboard.css';
import Topbar from "@/components/Topbar/Topbar.tsx";
import TelescopeView from "@/components/TelescopeView/TelescopeView.tsx";
import AscomVideoFeed from "@/components/AscomVideoFeed/AscomVideoFeed.tsx";
import AllSkyView from "@/components/AllSkyView/AllSkyView.tsx";
import SkyObjectList from "@/components/SkyObjectList/SkyObjectList.tsx";
import WeatherData from "@/components/WeatherData/WeatherData.tsx";
import TelescopeStatus from "@/components/TelescopeStatus/TelescopeStatus.tsx";
import TelescopeControls from "@/components/TelescopeControls/TelescopeControls.tsx";
import CollapsiblePanel from "@/components/CollapsiblePanel/CollapsiblePanel.tsx";
import { TelescopeProvider, useTelescopeContext } from "@/contexts/TelescopeContext";
import { CameraProvider } from "@/contexts/CameraContext";
import { AllSkyCameraProvider } from "@/contexts/AllSkyCameraContext";

function DashboardContent() {
    const { connectionMode } = useTelescopeContext();

    //console.log('[Dashboard] Current connection mode:', connectionMode);

    return (
        <article className="dashboard">
            <section className="topbar">
                <Topbar />
            </section>
            <section className="telescope-view">
                {connectionMode === 'simulation' && <TelescopeView key="telescope-view-sim" />}
                {connectionMode === 'ascom' && <AscomVideoFeed key="ascom-feed" />}
            </section>
            <div className="dashboard__menus">
                <div className="dashboard__menus__left">
                    <section className="sky-object-list">
                        <CollapsiblePanel side="left">
                            <SkyObjectList />
                        </CollapsiblePanel>
                    </section>
                    <section className="weather-data">
                        <CollapsiblePanel side="left">
                            <WeatherData />
                        </CollapsiblePanel>
                    </section>
                </div>
                <div className="dashboard__menus__right">
                    <section className="allsky-view">
                        <CollapsiblePanel side="right">
                            <AllSkyView />
                        </CollapsiblePanel>
                    </section>
                    <section className="telescope-status">
                        <CollapsiblePanel side="right">
                            <TelescopeStatus />
                        </CollapsiblePanel>
                    </section>
                    <section className="telescope-controls">
                        <CollapsiblePanel side="right">
                            <TelescopeControls />
                        </CollapsiblePanel>
                    </section>
                </div>
            </div>
        </article>
    );
}

export default function Dashboard() {
    return (
        <TelescopeProvider>
            <CameraProvider>
                <AllSkyCameraProvider>
                    <DashboardContent />
                </AllSkyCameraProvider>
            </CameraProvider>
        </TelescopeProvider>
    );
}
