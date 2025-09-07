import Topbar from "@/components/Topbar/Topbar.tsx"
import TelescopeView from "@/components/TelescopeView/TelescopeView.tsx"
import './Dashboard.css';

export default function Dashboard() {
    return (
        <>
            <section className="topbar">
                <Topbar />
            </section>
            <TelescopeView />
        </>
    );
}
