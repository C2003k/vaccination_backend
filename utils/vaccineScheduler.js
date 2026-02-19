import Vaccine from "../models/Vaccine.js";
import VaccinationRecord from "../models/VaccinationRecord.js";

/**
 * Calculate upcoming vaccines for a child
 * @param {Object} child - Child document
 * @param {Array} allVaccines - List of all available vaccines (optional, will fetch if not provided)
 * @param {Array} childRecords - List of child's vaccination records (optional, will fetch if not provided)
 * @returns {Promise<Array>} List of upcoming vaccines with due dates
 */
export const calculateUpcomingVaccines = async (child, allVaccines = null, childRecords = null) => {
    try {
        // 1. Fetch data if not provided
        if (!allVaccines) {
            allVaccines = await Vaccine.find({ isActive: true });
        }

        if (!childRecords) {
            childRecords = await VaccinationRecord.find({ child: child._id });
        }

        const upcomingVaccines = [];
        const birthDate = new Date(child.dateOfBirth);
        const today = new Date();

        // 2. Iterate through all vaccines to check eligibility
        for (const vaccine of allVaccines) {
            // Check if vaccine is already given (considering doses)
            const records = childRecords.filter(r => r.vaccine.toString() === vaccine._id.toString());

            // Determine the next dose number needed
            const nextDoseSequence = records.length + 1;

            // Check if max doses reached
            // Assuming simplified logic: if vaccine has boosters, check sequence. 
            // If it's a single dose vaccine (no boosters defined or empty), and records.length >= 1, it's done.
            // If it has boosters, we need to check if we are at the end of the series.

            // Let's assume 'vaccine' object has 'dosage' string. 
            // But we need to know how many doses are total.
            // The schema has 'boosterDoses' array.

            let isCompleted = false;
            let recommendedAge = { ...vaccine.recommendedAge }; // Default for 1st dose

            if (nextDoseSequence === 1) {
                // First dose needed
                // recommendedAge is already set
            } else {
                // Check boosters
                const booster = vaccine.boosterDoses.find(b => b.sequence === nextDoseSequence);
                if (booster) {
                    recommendedAge = booster.recommendedAge;
                } else {
                    // No booster for this sequence, so it's completed
                    isCompleted = true;
                }
            }

            if (isCompleted) continue;

            // 3. Calculate Due Date
            const dueDate = new Date(birthDate);
            // Add months
            dueDate.setMonth(dueDate.getMonth() + recommendedAge.months);
            // Add weeks (convert to days)
            dueDate.setDate(dueDate.getDate() + (recommendedAge.weeks * 7));

            // 4. Determine status
            // If date is in past => 'overdue' (or just 'due')
            // If date is in future => 'upcoming'

            // Optionally, we can filter out vaccines that are WAY in the future (e.g., > 2 months away)
            // But usually we want to see the next one regardless.

            // Check if it's "due" (e.g. within next month or overdue)
            // Or just return the *next* immediate dose for this vaccine type.

            // Let's verify we haven't already given this dose (double check)
            const alreadyGiven = records.find(r => r.doseSequence === nextDoseSequence);
            if (alreadyGiven) continue;

            // Calculate days remaining/overdue
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            upcomingVaccines.push({
                vaccineId: vaccine._id,
                name: `${vaccine.name} ${nextDoseSequence > 1 ? `(Dose ${nextDoseSequence})` : ''}`,
                doseSequence: nextDoseSequence,
                dueDate: dueDate,
                daysLeft: diffDays, // Negative means overdue
                status: diffDays < 0 ? 'overdue' : 'upcoming'
            });
        }

        // Sort by due date
        return upcomingVaccines.sort((a, b) => a.dueDate - b.dueDate);

    } catch (error) {
        console.error("Error calculating upcoming vaccines:", error);
        return [];
    }
};

/**
 * Calculate vaccination status for a child
 * @param {Array} upcomingVaccines - Result from calculateUpcomingVaccines
 * @returns {String} 'up-to-date', 'behind', 'completed'
 */
export const calculateVaccinationStatus = (upcomingVaccines) => {
    if (upcomingVaccines.length === 0) return 'completed'; // Assuming no more vaccines needed means completed? Or fully vaxxed.

    // If any vaccine is overdue by more than 14 days (2 weeks buffer), they are defaulting
    const isDefaulting = upcomingVaccines.some(v => v.daysLeft < -14);

    if (isDefaulting) return 'behind';
    return 'up-to-date';
};
