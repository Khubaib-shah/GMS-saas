import { startOfDay, addDays, getDay, parse, format, addMinutes, isBefore, isAfter } from "date-fns";
import TrainerAvailability from "@/models/TrainerAvailability";
import TrainerSlot from "@/models/TrainerSlot";
import User from "@/models/User";
import connectDB from "@/lib/db";

export async function generateTrainerSlots(
    trainerId: string,
    gymId: string,
    branchId: string,
    daysLookAhead: number = 14
) {
    await connectDB();

    // 1. Verify trainer exists and is active
    const trainer = await User.findOne({
        _id: trainerId,
        gymId,
        role: "trainer",
        deletedAt: null,
    });

    if (!trainer || trainer.trainerStatus !== "active") {
        console.log(`Skipping slot generation for trainer ${trainerId}: Trainer not active or not found.`);
        return;
    }

    // 2. Fetch recurring availability
    const availabilities = await TrainerAvailability.find({
        trainerId,
        gymId,
        recurring: true,
        deletedAt: null,
    });

    if (availabilities.length === 0) {
        console.log(`No recurring availability found for trainer ${trainerId}.`);
        return;
    }

    const today = startOfDay(new Date());
    const endDate = addDays(today, daysLookAhead);

    let slotsCreated = 0;

    // 3. Iterate through each day in the window
    for (let d = 0; d < daysLookAhead; d++) {
        const currentDate = addDays(today, d);
        const dayOfWeek = getDay(currentDate);

        if (dayOfWeek === 0) continue; // Skip Sundays

        // Find availability for this day of week
        const dailyAvails = availabilities.filter((a) => a.dayOfWeek === dayOfWeek);

        for (const avail of dailyAvails) {
            const { startTime, endTime, slotDurationMinutes } = avail;

            let currentSlotStart = parse(startTime, "HH:mm", currentDate);
            const dayEnd = parse(endTime, "HH:mm", currentDate);

            while (isBefore(currentSlotStart, dayEnd)) {
                const currentSlotEnd = addMinutes(currentSlotStart, slotDurationMinutes);

                // Ensure we don't exceed the availability end time
                if (isAfter(currentSlotEnd, dayEnd)) break;

                const startTimeStr = format(currentSlotStart, "HH:mm");
                const endTimeStr = format(currentSlotEnd, "HH:mm");

                // 4. Check if slot already exists to prevent duplicates
                const existingSlot = await TrainerSlot.findOne({
                    trainerId,
                    date: currentDate,
                    startTime: startTimeStr,
                    gymId,
                });

                if (!existingSlot) {
                    await TrainerSlot.create({
                        trainerId,
                        availabilityId: avail._id,
                        date: currentDate,
                        startTime: startTimeStr,
                        endTime: endTimeStr,
                        capacity: trainer.maxMembersPerSlot || 1,
                        bookedCount: 0,
                        status: "available",
                        gymId,
                        branchId: branchId || avail.branchId || trainer.branchId,
                    });
                    slotsCreated++;
                }

                currentSlotStart = currentSlotEnd;
            }
        }
    }

    return slotsCreated;
}

/**
 * Global trigger to generate slots for all active trainers in a gym
 */
export async function generateAllTrainerSlots(gymId: string) {
    await connectDB();
    const trainers = await User.find({
        gymId,
        role: "trainer",
        trainerStatus: "active",
        deletedAt: null,
    });

    let totalSlots = 0;
    for (const trainer of trainers) {
        const count = await generateTrainerSlots(trainer._id, gymId, trainer.branchId);
        totalSlots += count || 0;
    }
    return totalSlots;
}
