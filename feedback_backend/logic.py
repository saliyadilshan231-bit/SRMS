def format_modules(modules):
    if not modules:
        return ""
    if len(modules) == 1:
        return f"in {modules[0]}"
    if len(modules) == 2:
        return f"in {modules[0]} and {modules[1]}"
    return f"in modules such as {modules[0]}, {modules[1]} and others"

SEMESTER_FEEDBACK = {
    "1st Year": {
        "Semester 1": {
            0: "Your initial transition into 1st Year Semester 1 indicates significant struggles {modules_str}. Adjusting to university-level academics is hard, but you need to act now. Please connect with your advisor immediately to formulate a recovery plan for your fundamental courses.",
            1: "You have completed 1st Year Semester 1, but there is substantial room for improvement {modules_str}. Focus heavily on mastering these foundational concepts, as they will be critical for your second semester.",
            2: "Good effort in your 1st Year Semester 1. You've demonstrated a solid grasp of your introductory courses {modules_str}. Pushing for more depth will prepare you perfectly for Semester 2.",
            3: "Exceptional start to 1st Year Semester 1! You have shown outstanding dedication to mastering your foundational subjects {modules_str}. Maintain this momentum as you move into the latter half of the year."
        },
        "Semester 2": {
            0: "Your 1st Year Semester 2 performance is critically low {modules_str}. You must reassess your study habits from Semester 1 and seek tutoring to ensure you are ready to progress to your second year.",
            1: "You passed 1st Year Semester 2 but must focus on bridging knowledge gaps {modules_str} before attempting the more advanced 2nd Year modules.",
            2: "A very solid finish to your 1st Year Semester 2. Your grasp of {modules_str} shows you are well-prepared for 2nd Year challenges. Keep it up!",
            3: "An outstanding conclusion to 1st Year Semester 2! Your mastery of {modules_str} sets an incredibly strong foundation for your sophomore year."
        }
    },
    "2nd Year": {
        "Semester 1": {
            0: "Your performance in 2nd Year Semester 1 {modules_str} suggests you are struggling with the jump in complexity. Reach out for academic support to prevent this from affecting your core degree requirements.",
            1: "A challenging start to your 2nd Year Semester 1. Review your weak points {modules_str} carefully, as these intermediate subjects are vital for your upcoming semester.",
            2: "Good work taking on the challenges of 2nd Year Semester 1. Your performance {modules_str} is commendable. Keep refining your approach for even better results.",
            3: "Excellent performance in 2nd Year Semester 1! Your command over these advanced topics {modules_str} is impressive. Keep pushing for practical applications of this knowledge."
        },
        "Semester 2": {
            0: "Your 2nd Year Semester 2 marks are concerning {modules_str}. It is crucial that you reassess your understanding before heading into your 3rd Year, which will demand greater independence.",
            1: "You have made it through 2nd Year Semester 2, but your understanding {modules_str} needs strengthening. Consider summer revision to prepare for junior year.",
            2: "Solid performance in 2nd Year Semester 2. Your grasp {modules_str} shows good progress. Consider seeking out intermediate projects or internships.",
            3: "Outstanding work in 2nd Year Semester 2! Mastering {modules_str} with such high marks puts you in a fantastic position for leadership and specialized tracks in your 3rd Year."
        }
    },
    "3rd Year": {
        "Semester 1": {
            0: "3rd Year Semester 1 has proven to be extremely difficult for you {modules_str}. You must immediately seek guidance to prevent graduation delays.",
            1: "You survived 3rd Year Semester 1, but your performance {modules_str} lacks the rigor expected at this stage. Elevate your study methods as soon as possible.",
            2: "Good execution in your 3rd Year Semester 1. You handled {modules_str} well. Start focusing on aligning these subjects with your career goals.",
            3: "Exceptional mastery in 3rd Year Semester 1! Your deep understanding {modules_str} proves you are highly capable in specialized fields."
        },
        "Semester 2": {
             0: "Critical attention is needed for your 3rd Year Semester 2 performance {modules_str}. You risk being underprepared for your final year project.",
             1: "Adequate performance in 3rd Year Semester 2 {modules_str}, but you should aim higher to ensure a strong profile for your final year.",
             2: "Strong performance in 3rd Year Semester 2! Your handling of {modules_str} is impressive. Start planning your final year project based on these strengths.",
             3: "Phenomenal results in 3rd Year Semester 2! Excelling {modules_str} puts you in top contention for honors and select placements next year."
        }
    },
    "Final Year": {
         "Semester 1": {
             0: "Your Final Year Semester 1 requires immediate intervention {modules_str}. Reach out to advisors to map out a salvage strategy for graduation.",
             1: "You are passing Final Year Semester 1 {modules_str}, but need to focus heavily to ensure you graduate with a competitive grade.",
             2: "Solid work in your Final Year Semester 1 {modules_str}. Maintain this consistency so you can dedicate time to your final thesis/project smoothly.",
             3: "Outstanding Final Year Semester 1! Your excellence {modules_str} reflects supreme readiness for the professional world."
         },
         "Semester 2": {
             0: "Your final semester marks {modules_str} are severely lacking. Please contact your academic department immediately regarding graduation requirements.",
             1: "You have completed your final semester {modules_str}. Focus on tying up any loose ends as you transition into your post-graduation journey.",
             2: "A great finish in your final semester {modules_str}. You've demonstrated reliable competence. Best of luck in your career!",
             3: "An incredible conclusion to your academic journey! Mastering {modules_str} perfectly crowns your degree. You are primed for massive success."
         }
    },
    "Graduating": {
        "Semester 1": { 0: "", 1: "", 2: "", 3: "" },
        "Semester 2": { 0: "", 1: "", 2: "", 3: "" }
    }
}

YEARLY_FEEDBACK = {
    "1st Year": {
        0: "Your 1st Year overall has been highly challenging. It's critical to review your foundations before moving onto Year 2.",
        1: "A fair 1st Year overall. Ensure you patch up the learning gaps from this year before intermediate modules begin.",
        2: "A very good 1st Year! You've established a great baseline. Continue building on this consistency.",
        3: "An exceptional 1st Year! You have mastered the fundamentals in an exemplary manner."
    },
    "2nd Year": {
        0: "Your 2nd Year overall points to significant systemic struggles. A major change in approach is needed for your junior year.",
        1: "A steady 2nd Year overall, though bridging some intermediate learning gaps will be essential before 3rd Year.",
        2: "A very strong 2nd Year! You've handled the difficulty spike well. Look into internships to apply your knowledge.",
        3: "An outstanding 2nd Year! Your mastery of intermediate concepts proves your deep capability in this field."
    },
    "3rd Year": {
       0: "Your 3rd Year overall is uncharacteristically low. You must aggressively seek support before jumping into your final year.",
       1: "A passing 3rd Year overall. You will need to ramp up your focus as you head into your crucial final year projects.",
       2: "A commendable 3rd Year! You've balanced specialized subjects wonderfully. You are very prepared for your final year.",
       3: "An extraordinary 3rd Year! Your consistently high performance in specialized tracks is incredibly impressive."
    },
    "Final Year": {
        0: "Your Final Year overall fell short of expectations. Work with advisors to outline your next steps for graduation and beyond.",
        1: "You've successfully completed your Final Year. Reflect on your journey and prepare diligently for the job market.",
        2: "A very strong Final Year. You've proven your competence and reliability—key traits for a successful career.",
        3: "A phenomenal Final Year! You have graduated with top-tier mastery and are completely ready to excel in the industry."
    },
    "Graduating": { 0: "", 1: "", 2: "", 3: "" }
}

def get_feedback(tier, year, semester=None, modules=None, is_overall=False):
    mod_str = format_modules(modules)
    
    if is_overall:
        year_dict = YEARLY_FEEDBACK.get(year)
        if year_dict:
            return year_dict.get(tier, "Maintain a consistent study routine.")
        return "Maintain a consistent study routine."
        
    year_dict = SEMESTER_FEEDBACK.get(year)
    if year_dict:
        sem_dict = year_dict.get(semester)
        if sem_dict:
            msg = sem_dict.get(tier, "Stay focused on your studies.")
            return msg.replace("{modules_str}", mod_str).strip()
            
    return "Stay focused and maintain a consistent study routine."
