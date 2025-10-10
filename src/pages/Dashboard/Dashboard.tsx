import './Dashboard.css';
import Topbar from "@/components/Topbar/Topbar.tsx";
// import TelescopeView from "@/components/TelescopeView/TelescopeView.tsx";
import CameraLiveView from "@/components/CameraLiveView/CameraLiveView.tsx";
import CameraPreviewControls from "@/components/CameraPreviewControls/CameraPreviewControls.tsx";
import AllSkyView from "@/components/AllSkyView/AllSkyView.tsx";
import SkyObjectList from "@/components/SkyObjectList/SkyObjectList.tsx";
import WeatherData from "@/components/WeatherData/WeatherData.tsx";
import TelescopeStatus from "@/components/TelescopeStatus/TelescopeStatus.tsx";
import TelescopeControls from "@/components/TelescopeControls/TelescopeControls.tsx";
import CameraControls from "@/components/CameraControls/CameraControls.tsx";

export default function Dashboard() {
    const handleStartPreview = () => {
        window.dispatchEvent(new Event('startCameraPreview'));
    };

    const handleStopPreview = () => {
        window.dispatchEvent(new Event('stopCameraPreview'));
    };

    const handleRefresh = () => {
        window.dispatchEvent(new Event('refreshCameraPreview'));
    };

    return (
        <article className="dashboard">
            <section className="topbar">
                <Topbar />
            </section>
            <section className="telescope-view">
                {/* Sky simulation replaced with camera live view */}
                {/* <TelescopeView /> */}
                <CameraLiveView />
            </section>
            <div className="dashboard__menus">
                <div className="dashboard__menus__left">
                    <section className="sky-object-list">
                        <SkyObjectList />
                    </section>
                    <section className="weather-data">
                        <WeatherData />
                    </section>
                    <section className="camera-preview-controls">
                        <CameraPreviewControls
                            onStartPreview={handleStartPreview}
                            onStopPreview={handleStopPreview}
                            onRefresh={handleRefresh}
                        />
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
                    <section className="camera-controls">
                        <CameraControls />
                    </section>
                </div>
            </div>
        </article>
    );
}
