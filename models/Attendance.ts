import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
    {
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
        date: { type: Date, required: true },
        checkInTime: { type: Date, required: true },
        checkOutTime: { type: Date },
        status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    },
    { timestamps: true }
);

AttendanceSchema.index({ gymId: 1, date: 1 });
AttendanceSchema.index({ memberId: 1, date: 1 });

AttendanceSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
