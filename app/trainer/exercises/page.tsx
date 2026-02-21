import { ExerciseLibrary } from "@/modules/trainer/ExerciseLibrary";

export const metadata = {
    title: "Exercise Library | GMS",
    description: "Manage your exercise repertoire",
};

export default function TrainerExercisesPage() {
    return <ExerciseLibrary />;
}
