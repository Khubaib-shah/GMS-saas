import { WorkoutTemplates } from "@/modules/trainer/WorkoutTemplates";

export const metadata = {
    title: "Workout Templates | GMS",
    description: "Build and manage reusable workout blueprints",
};

export default function TrainerTemplatesPage() {
    return <WorkoutTemplates />;
}
