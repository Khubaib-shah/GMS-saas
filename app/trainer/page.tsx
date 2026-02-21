import { TrainerDashboard } from "@/modules/trainer/TrainerDashboard";

export const metadata = {
    title: "Trainer Dashboard | GMS",
    description: "Overview and quick actions for trainers",
};

export default function TrainerPage() {
    return <TrainerDashboard />;
}
