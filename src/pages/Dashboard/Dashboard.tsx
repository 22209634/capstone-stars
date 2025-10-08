import './Dashboard.css';
import Topbar from "@/components/Topbar/Topbar.tsx";
import TelescopeView from "@/components/TelescopeView/TelescopeView.tsx";
import AllSkyView from "@/components/AllSkyView/AllSkyView.tsx";
import SkyObjectList from "@/components/SkyObjectList/SkyObjectList.tsx";
import WeatherData from "@/components/WeatherData/WeatherData.tsx";
import TelescopeStatus from "@/components/TelescopeStatus/TelescopeStatus.tsx";
import TelescopeControls from "@/components/TelescopeControls/TelescopeControls.tsx";
import CollapsiblePanel from "@/components/CollapsiblePanel/CollapsiblePanel.tsx";
import { TelescopeProvider } from "@/contexts/TelescopeContext";

export default function Dashboard() {
    return (
        <TelescopeProvider>
            <article className="dashboard">
                <section className="topbar">
                    <Topbar />
                </section>
                <section className="telescope-view">
                    <TelescopeView />
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
        </TelescopeProvider>
    );
}
