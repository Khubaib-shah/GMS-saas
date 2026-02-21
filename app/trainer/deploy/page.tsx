import { AssignWorkout } from "@/modules/trainer/AssignWorkout";

export const metadata = {
    title: "Assign Workouts | GMS",
    description: "Assign workout plans to members",
};

export default function TrainerAssignPage() {
    return <AssignWorkout />;
}
