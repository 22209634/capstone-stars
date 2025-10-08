import './Dashboard.css';
import Topbar from "@/components/Topbar/Topbar.tsx";
import TelescopeView from "@/components/TelescopeView/TelescopeView.tsx";
import AllSkyView from "@/components/AllSkyView/AllSkyView.tsx";
import SkyObjectList from "@/components/SkyObjectList/SkyObjectList.tsx";
import WeatherData from "@/components/WeatherData/WeatherData.tsx";
import TelescopeStatus from "@/components/TelescopeStatus/TelescopeStatus.tsx";
import TelescopeControls from "@/components/TelescopeControls/TelescopeControls.tsx";
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
                            <SkyObjectList />
                        </section>
                        <section className="weather-data">
                            <WeatherData />
                        </section>
                    </div>
                    <div className="dashboard__menus__right">
                        <section className="allsky-view">
                            <AllSkyView />
                        </section>
                        <section className="telescope-status">
                            <TelescopeStatus />
                        </section>
                        <section className="telescope-controls">
                            <TelescopeControls />
                        </section>
                    </div>
                </div>
            </article>
        </TelescopeProvider>
    );
}
