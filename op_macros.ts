/*
 * Moodle JS OP Macros
 * Implements specific tasks.
 */


let opm_course_list:    WS_Course_1[]   = [];
let opm_course_current: number          = 0;

let opm_progress:       HTMLProgressElement;


function escapeHTML(text: string) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");  // TODO: Line breaks?  nbsp?
}


async function opm_init(tab_id: number, progress: HTMLProgressElement): Promise<void> {

    opm_progress = progress;

    try {
        await ws_init(tab_id, progress);
    } catch (err) {
        if (   err.message == "WSC doc details get, couldn't get logout menu item."
            || err.message == "Missing host permission for the tab" /* Firefox 57 */ )
                                                                                { throw new Error("Couldn't get Moodle login details.\n"); }
        else                                                                    { throw (err); }
    }

    opp_wwwroot_update();

}




function opm_info(message: string): void {
    const message_full: string  = "https://moodle.op.ac.nz/course/view.php?id=" + opm_course_list[opm_course_current].id + " " + opm_course_list[opm_course_current].fullname + ": " + message + "\n";
    opp_info_add(message_full);
}





async function opm_course_list_get(): Promise<void> {

    // Get the course list
    opm_course_list = await ws_call({wsfunction: "core_course_get_courses_displayed_x"});

    opp_course_list_update();

}





async function opm_course_list_for_each(fun: (course_id: number, course_fullname: string) => Promise<void>, start: number): Promise<void> {

    for (let step = start; step < opm_course_list.length; step++) {
        opm_course_current = step;
        opp_course_current_update();

        await fun.call(undefined, opm_course_list[step].id, opm_course_list[step].fullname);
    }
}





async function opm_course_list_roles_check(start: number): Promise<void> {

    await opm_course_list_for_each(opm_roles_check, start);

}


async function opm_roles_check(courseid: number): Promise<void> {

    let role_problem: boolean;

    const users = await ws_call({wsfunction: "core_enrol_get_enrolled_users", courseid: courseid, options: [{name: "limitnumber", value: 1000}]});
    role_problem = false;
    for (const user of users) {
        const roles = user.roles;
        if (roles) { /*OK*/ } else                                              { throw new Error("Couldn't get user roles."); }
        for (const role of roles) {
            role_problem = role_problem || (role.name.toUpperCase().match(/\bDRAFT 2016\b/) != null) || (role.name.toUpperCase().match(/\bCOPY\b/) != null);
        }
    }
    if (role_problem) {
        opm_info("Deprecated role.");
    }
}



async function opm_course_list_template_check(start: number): Promise<void> {

    await opm_course_list_for_each(opm_template_check_banner, start);

}



async function opm_template_check_banner(courseid: number) {

    // Get course content
    const content           = await ws_call({wsfunction: "core_course_get_contents", courseid: courseid});

    if (content[0].summary.match(/background-image: url\('https:\/\/moodle\.op\.ac\.nz\/pluginfile\.php\/\d+\/course\/section\/\d+\/(?:Moodle_(?:course|programme)_banner-black-overlay\.jpg|EV%20banner\.png)'\)/)) {
        opm_info("Banner image possibly not changed.");
    }

}



// TODO: Check

async function opm_template_check(courseid: number, course_fullname: string) {
    // const parser = new DOMParser();

    // Get course details
    const course = await ws_call({wsfunction: "core_course_get_course_x", courseid: courseid});

    // Check name and format
    const course_name_san = course.fullname.replace(/\s+/g, " ").trim().toUpperCase();


    if (
           course_name_san.match(/\bSANDPIT\b/   )) {
        opm_info("Sandpit, ignoring.");
        return;
    }

    if (course.format != "onetopic") {
        opm_info("Unexpected course format: " + course.format);
        return;
    }

    if (   // course_name_san.match(/\bPAGE\b/      )
           course_name_san.match(/\bTURNITIN\b/  )
        || course_name_san.match(/\bGLOSSARIES\b/)
        || course_name_san.match(/\bTEAM PAGE\b/ ) ) {
        opm_info("Special course, should be included in programme page?");
        return;
    }

    // if (   course_name_san.match(/\bOLD\b/     )
    //    || course_name_san.match(/\b201[0-6]\b/) ) {
    //    await opm_info("Old course");
    //    return;
    // }

    // Get course content
    const content           = await ws_call({wsfunction: "core_course_get_contents", courseid: courseid});
    // const s0a_name_san      = content[0].name.replace(/\s+/g, " ").trim().toUpperCase();
    // const s0a_summary_san   = (parser.parseFromString(content[0].summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

    if (course_fullname.replace(/\s+/g, " ").toUpperCase().match(/\bPROGRAMMES?\b/) || content[0].name.toUpperCase().match(/\bPROGRAMMES?\b/)) { // PROGRAMMES

        if (!course_fullname.match(/\bPROGRAMME PAGE\b/) && !course_fullname.match(/\bProgramme Page\b/) && !course_fullname.match(/\bProgramme page\b/) && !course_fullname.match(/\bprogramme page\b/)) {
            opm_info("Programme page name doesn't contain 'PROGRAMME PAGE'.");
            return;
        }


        const expected_tabs: string[][] = [
            ["Programme home", "Programme Home"], // , "BAS"],
            ["About this programme", "About these programmes", "About the VNA programme", "BSS info", "BSS Info", "Programme structure", "Programme Structure"], // "Dunedin campus programme", "Dunedin Campus Programme"],
            // "Year one-three | 1-3" instead of or after "About..."
            ["Our staff", "Programme staff", "Your VNA staff"],
            // "Student feedback",
            // "Useful resources"
        ];
        let tab_count = 0;
        let expect_tab_count = 0;
        let tab_mismatch = false;
        while (!tab_mismatch && tab_count < content.length && expect_tab_count < expected_tabs.length) {
            if (expected_tabs[expect_tab_count].includes(content[tab_count].name)) {
                tab_count += 1;
                expect_tab_count += 1;
            // else if "Year one-three | 1-3" instead of or after "About"
            } else {
                tab_mismatch = true;
            }
        }
        if (tab_mismatch) {
            opm_info("Programme tab expected '" + expected_tabs[expect_tab_count][0] + "', found '" + content[tab_count].name + "'.");
            return;
        } else if (tab_count >= content.length && expect_tab_count < expected_tabs.length) {
            opm_info("Programme tab expected '" + expected_tabs[expect_tab_count][0] + "', found end of list.");
            return;
        }


    } else {

        // Check section names


        const expected_tabs: string[][] = [
            ["Haere mai", "haere mai", "Haere mai / Welcome", "Haere mai, Welcome", "Welcome", "Course home", "Course Home", "Home", "Course overview", "COURSE OVERVIEW", "Project overview"], // "Timetable"], course name?
            // "About this course", "Land Surveying 1 Course Outline 2017", "Project schedule", "Getting started", "Schedule", "Course information"
            // "Modules and assessments" in place of Assessments and Modules
            // "Assessments - FT" and "Assessments - PT" in place of Assessments
            ["Assessments", "assessments", "ASSESSMENTS",
             "Assessments and Clinical Placements", "Assessments and Clinical Placements ",
             "Key Dates and Assessments", "Assessment", "Assessment and Moderation", "Assignments", "Project rubric"], // "Course expectations", "Course Expectations"], //"Placeholder", "Placeholder - do not move", "Topic 2"],
            // Module names
            ["Modules", "modules", "MODULES", "Module",
            "Lesson module", "Lesson Module", "Topics", "LECTURE SERIES", "Readings", "Case studies", "Projects", "Project work", "Project Brief: Design in Four Ways"], // "Postgraduate Supervision"] // optional for projects?
            // "Resources",
            // "Facilitator notes"
        ];
        let tab_count = 0;
        let expect_tab_count = 0;
        let tab_mismatch = false;
        while (!tab_mismatch && tab_count < content.length && expect_tab_count < expected_tabs.length) {
            if (expected_tabs[expect_tab_count].includes(content[tab_count].name)) {
                tab_count += 1;
                expect_tab_count += 1;
            } else if ((expect_tab_count == 1) && (content[tab_count].name == "Getting started" || content[tab_count].name == "Getting Started")) {
                tab_count += 1;
            } else if ((expect_tab_count == 2) && (content[tab_count].name == "Resources") && course_fullname.toUpperCase().match(/\bPROJECT\b/) ) {
                expect_tab_count += 1;
            } else {
                tab_mismatch = true;
            }
        }
        if (tab_mismatch) {
            opm_info("Course tab expected '" + expected_tabs[expect_tab_count][0] + "', found '" + content[tab_count].name + "'.");
            return;
        } else if (tab_count >= content.length && expect_tab_count < expected_tabs.length) {
            opm_info("Course tab expected '" + expected_tabs[expect_tab_count][0] + "', found end of list.");
            return;
        }

    }

}




async function opm_course_list_remove_getting_started(start: number): Promise<void> {

    await opm_course_list_for_each(opm_remove_getting_started, start);

}


async function opm_remove_getting_started(courseid: number) {
    const parser = new DOMParser();

    // Run on the programmes category?

    // Get course details
    const course = await ws_call({wsfunction: "core_course_get_course_x", courseid: courseid});

    // Check name and format
    const course_name_san = course.fullname.replace(/\s+/g, " ").trim().toUpperCase();
    if (   course_name_san.match(/\bOLD\b/     )
        || course_name_san.match(/\b201[0-6]\b/) ) {
        opm_info("Skipping old course");
        return;
    }
    if (   course_name_san.match(/\bPAGE\b/      )
        || course_name_san.match(/\bSANDPIT\b/   )
        || course_name_san.match(/\bTURNITIN\b/  )
        || course_name_san.match(/\bGLOSSARIES\b/) ) {
        opm_info("Skipping special course");
        return;
    }
    if (course.format != "onetopic") {
        opm_info("Skipping due to course format: " + course.format);
        return;
    }

    // Get section 0
    const s0a               = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 0}]}))[0];
    const s0a_name_san      = s0a.name.replace(/\s+/g, " ").trim().toUpperCase();
    const s0a_summary_san   = (parser.parseFromString(s0a.summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

    // Check first section title
    if (s0a_name_san == "HAERE MAI") { /*OK*/ }
    else {
        opm_info("Skipping due to section 0 name: " + s0a.name);  // TODO: Figure out why got "Topic 0" one time.
        return;
    }

    // Check first section text
    if (   (s0a_summary_san.match(/\bTĒNĀ KOUTOU, AND WELCOME TO\b/) || s0a_summary_san.match(/\bTHIS COURSE\b/ ))
        && !s0a_summary_san.match(/\bTHIS PROJECT\b/) ) { /*OK*/ }
    else {
        opm_info("Skipping due to section 0 summary");
        return;
    }

    // TODO: Change "SUPPORT AND COMMMUNICATION" to "SUPPORT AND COMMUNICATION" (drop third "M").

    // Check getting started section
    const sec1          = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 1}]}))[0];
    const sec1_name_san = sec1.name.replace(/\s+/g, " ").trim().toUpperCase();

    if (sec1_name_san == "GETTING STARTED") {

        const expected_mods: string[] = [
            "IS MY MOODLE PROFILE UP TO DATE",  // Alternative placement to below
            "HOW DO I USE OP MOODLE",
            "HOW DO I USE MOODLE",              // Alternitive to above
            "IS MY MOODLE PROFILE UP TO DATE",
            "WHAT AM I EXPECTED TO DO",
            "WHAT ONLINE SKILLS DO I NEED",
            "WHAT IS THE TO DO",
            "WHAT IS THE PROGRESS",             // Alternative to above
            "WHAT IS THE COMPLETION",           // Another alternative to above
            "WHERE CAN I FIND HELP",
            "HOW CAN I HELP MYSELF",
            "HOW DO I USE OP MOODLE",           // Some courses have a second copy
            "IS MY MOODLE PROFILE UP TO DATE",
            "WHAT AM I EXPECTED TO DO IN THIS COURSE",
            "WHAT ONLINE SKILLS DO I NEED",
            "WHAT IS THE TO DO BLOCK",
            "WHERE CAN I FIND HELP",
            "HOW CAN I HELP MYSELF",
            "TICK THE BOXES DOWN THE RIGHTHAND SIDE OF THE PAGE",   // Optional
            "YOU KNOW THE ANSWERS TO ALL OF THESE QUESTIONS",       // Alternative
        ];
        let mod_count = 0;
        let expect_mod_count = 0;
        while (mod_count < sec1.modules.length && expect_mod_count < expected_mods.length) {
            if (sec1.modules[mod_count].name.replace(/\s+/g, " ").trim().toUpperCase().search(expected_mods[expect_mod_count]) > -1) {
                mod_count += 1;
                expect_mod_count += 1;
            } else {
                expect_mod_count += 1;
            }
        }
        if (mod_count < sec1.modules.length) {
            opm_info("Skipping, Getting Started label not expected at: " + mod_count);
            return;
        }
    } else if (sec1_name_san == "ASSESSMENTS") { /*OK*/ }
    else {
        opm_info("Skipping, Section 1 name not expected.");
        return;
    }

    // const sec2 = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 2}]}))[0];
    // const sec2_name_san = sec2.name.replace(/\s+/g, " ").trim().toUpperCase();
    // if (sec2_name_san == "ASSESSMENTS") { /*OK*/ } else {
    //    await opm_info("Skipping, Section not expected: " + (sec2.name || sec2.section));
    //    return;
    // }

    // Check for expected text fragment
    const s0a_part_match    = s0a_summary_san.match(/\bGETTING STARTED\b/) != null;

    if (s0a_part_match) {

        // Define text  // "\xa0" is non-breaking space

        const s0b_summary_para_old1      =  "<p><strong>Begin</strong> this course by clicking on the <strong>Getting started</strong> tab above."; /* </p> */

        const s0b_summary_para_new1     =   "<p>Before you begin this course, familiarise yourself with\n"
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>."; /* </p> */

        const s0b_summary_para_old2      =  "<p><br>Take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment,</em> <em>Course Resources,</em> <em>Course Schedule,</em> "
                                          + "and <em>Support and Communication</em>.</p>\n"
                                          + "<p>Once you've done that, you can begin this course by clicking on the <strong>Getting started</strong> tab above.</p>";

        const s0b_summary_para_old2b     =  "<p><br />Take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment,</em> <em>Course Resources,</em> <em>Course Schedule,</em> "
                                          + "and <em>Support and Communication</em>.</p>\n"
                                          + "<p>Once you've done that, you can begin this course by clicking on the <strong>Getting started</strong> tab above.</p>";

        const s0b_summary_para_newish2   =  "<p>Before you begin this course, familiarise yourself with&nbsp;"
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>. "
                                          + "Then take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment,</em> <em>Course Resources,</em> <em>Course Schedule,</em> "
                                          + "and <em>Support and Communication</em>.</p>";

        const s0b_summary_para_newish2b  =  "<p>Before you begin this course, familiarise yourself with\xa0"
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>. "
                                          + "Then take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment,</em> <em>Course Resources,</em> <em>Course Schedule,</em> "
                                          + "and <em>Support and Communication</em>.</p>";

        const s0b_summary_para_newish2c  =  "<p>Before you begin this course, familiarise yourself with "
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>. "
                                          + "Then take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment,</em> <em>Course Resources,</em> <em>Course Schedule,</em> "
                                          + "and <em>Support and Communication</em>.</p>";

        const s0b_summary_para_newish2d  =  "<p>Before you begin this course, familiarise yourself with "
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>. "
                                          + "Then take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Environment</em>, <em>Course Resources</em>, <em>Course Schedule</em>, "
                                          + "and <em>Support and Communication</em>.</p>";

        const s0b_summary_para_new2     =   "<p></p>\n"
                                          + "\n"
                                          + "<p>Before you begin this course, familiarise yourself with\n"
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>.\n"
                                          + "Then take time to familiarise yourself with the information below -\n"
                                          + "this includes <em>Course Environment</em>, <em>Course Resources</em>, <em>Course Schedule</em>, and <em>Support and Communication</em>.</p>";

        const s0b_summary_para_old3    =    "<p>Take time to familiarise yourself with the information below - "
                                          + "this includes&nbsp;<em>Course Schedule</em>,&nbsp;<em>Support and Communication</em>, and the&nbsp;<em>Course Outline</em>.</p>\n"
                                          + "<p>Once you've done that, click on the&nbsp;<strong><em>Getting started</em></strong>&nbsp;tab above to make sure you are ready to begin.</p>";

        const s0b_summary_para_old3b   =    "<p>Take time to familiarise yourself with the information below - "
                                          + "this includes\xa0<em>Course Schedule</em>,\xa0<em>Support and Communication</em>, and the\xa0<em>Course Outline</em>.</p>\n"
                                          + "<p>Once you've done that, click on the\xa0<strong><em>Getting started</em></strong>\xa0tab above to make sure you are ready to begin.</p>";

        const s0b_summary_para_old3c   =    "<p>Take time to familiarise yourself with the information below - "
                                          + "this includes <em>Course Schedule</em>, <em>Support and Communication</em>, and the <em>Course Outline</em>.</p>\n"
                                          + "<p>Once you've done that, click on the <strong><em>Getting started</em></strong> tab above to make sure you are ready to begin.</p>";

        const s0b_summary_para_old3d    = "<p></p>\n<p>Take time to familiarise yourself with the information below - "
                                          + "this includes Course Schedule, Support and Communication, and the Course Outline.</p>\n"
                                          + "<p>Once you've done that, you can begin this course by clicking on the <strong>Getting started</strong> tab above.</p>";

        const s0b_summary_para_old3e    = /<p><br(?: \/)?>Take time to familiarise yourself with the information below - this includes(?:\s|&nbsp;)(?:<\/?em>)*Course (?:<\/?em>)*Schedule(?:<\/?em>)*,(?:<\/?em>)*(?:\s|&nbsp;)(?:<\/?em>)*Support and Communication(?:<\/?em>)*(?:,)?(?:<\/?em>)*(?:\s|&nbsp;)(?:<\/?em>)*and(?: the)?(?:<\/?em>)*(?:\s|&nbsp;)(?:<\/?em>)*Course Outline(?:\s|&nbsp;)?(?:<\/?em>)*.<\/p>\n<p>Once you've done that, you can begin this course by clicking on the <strong>Getting started<\/strong>(?:\s|&nbsp;)tab above.<\/p>/;

        const s0b_summary_para_new3     =   "<p>Before you begin this course, familiarise yourself with\n"
                                          + '<a href="http://studentservices.op.ac.nz/getting-started/getting-started-with-learning-online" target="_blank">'
                                          + "<strong>Getting started with online learning</strong></a>.\n"
                                          + "Then take time to familiarise yourself with the information below -\n"
                                          + "this includes <em>Course Schedule</em>, <em>Support and Communication</em>, and the <em>Course Outline</em>.</p>";


        // Find and replace paragraph text
        const s0b = await ws_call({wsfunction: "core_course_get_section_x", sectionid: s0a.id});
        let s0b_summary = s0b.summary;

        s0b_summary = s0b_summary.replace(s0b_summary_para_old1,  s0b_summary_para_new1);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old2,  s0b_summary_para_new2);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old2b, s0b_summary_para_new2);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old3,  s0b_summary_para_new3);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old3b, s0b_summary_para_new3);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old3c, s0b_summary_para_new3);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old3d, s0b_summary_para_new3);
        s0b_summary = s0b_summary.replace(s0b_summary_para_old3e, s0b_summary_para_new3);


        if (s0b_summary != s0b.summary) {
            await ws_call({wsfunction: "core_course_update_section_x", section: {id: s0b.id, summary: s0b_summary}});
        } else if (   s0b_summary.search(s0b_summary_para_new1    ) > -1
                   || s0b_summary.search(s0b_summary_para_newish2 ) > -1
                   || s0b_summary.search(s0b_summary_para_newish2b) > -1
                   || s0b_summary.search(s0b_summary_para_newish2c) > -1
                   || s0b_summary.search(s0b_summary_para_newish2d) > -1
                   || s0b_summary.search(s0b_summary_para_new2    ) > -1
                   || s0b_summary.search(s0b_summary_para_new3    ) > -1) {
            /* do nothing */
        } else {
            opm_info("Skipping, Intro paragraph partial match only. ***");
            return;
        }

    } else {
        opm_info("Skipping, Getting started not referenced.");
        return;
    }

    // Find "Course Environment" module
    let mod_num = 0;
    while (   mod_num < s0a.modules.length
           && (s0a.modules[mod_num].modname != "label" || !s0a.modules[mod_num].name.replace(/\s+/g, " ").trim().toUpperCase().startsWith("COURSE ENVIRONMENT"))) {
        mod_num += 1;
    }
    const mod_cea = mod_num < s0a.modules.length ? s0a.modules[mod_num] : null;

    // Check for expected text fragment
    let mod_cea_part_match = false;
    if (mod_cea) {
        const mod_cea_san      = mod_cea.name.replace(/\s+/g, " ").trim().toUpperCase();
        mod_cea_part_match   = (mod_cea_san.match(/\bGETTING STARTED\b/) != null) || (mod_cea_san.match(/\bUSING OP MOODLE\b/) != null);
    }

    if (mod_cea && mod_cea_part_match) {

        // Define CE text  // "\xa0" is non-breaking space
        const mod_ceb_para_old      =   "<p>You can find out more information on using OP Moodle by going to the&nbsp;<strong>Getting started</strong>&nbsp;tab above, "
                                      + "after you've finished reading the information below.</p>";
        const mod_ceb_para_old_b    =   "<p>You can find out more information on using OP Moodle by going to the\xa0<strong>Getting started</strong>\xa0tab above, "
                                      + "after you've finished reading the information below.</p>";
        const mod_ceb_para_old_c    =   "<p>You can find out more information on using OP Moodle by going to the <strong>Getting started</strong> tab above, "
                                      + "after you've finished reading the information below.</p>";
        const mod_ceb_para_newish   =   "<p>You can find out more information on "
                                      + '<strong><a href="http://studentservices.op.ac.nz/it-support/use-op-moodle/" target="_blank">using OP Moodle</a></strong>, '
                                      + "after you've finished reading the information below.</p>";
        const mod_ceb_para_new      =   "<p>You can find out more information on\n"
                                      + '<strong><a href="http://studentservices.op.ac.nz/it-support/use-op-moodle/" target="_blank">using OP Moodle</a></strong>,\n'
                                      + "after you've finished reading the information below.</p>";

        // Get description
        const mod_ceb       = (await ws_call({wsfunction: "core_course_get_course_module", cmid: mod_cea.id})).cm;
        let mod_ceb_desc    = mod_ceb.description || "";

        // Check and replace expected text
        mod_ceb_desc = mod_ceb_desc.replace(mod_ceb_para_old  , mod_ceb_para_new);
        mod_ceb_desc = mod_ceb_desc.replace(mod_ceb_para_old_b, mod_ceb_para_new);
        mod_ceb_desc = mod_ceb_desc.replace(mod_ceb_para_old_c, mod_ceb_para_new);

        if (mod_ceb.description && mod_ceb_desc != mod_ceb.description) {
            await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: mod_ceb.id, description: mod_ceb_desc}});
        } else if (   mod_ceb_desc.search(mod_ceb_para_newish) > -1
                   || mod_ceb_desc.search(mod_ceb_para_new   ) > -1) {
            /* do nothing */
        } else {
            opm_info("'Course environment' partial match only. ***");
        }

    } else if (mod_cea) {
        opm_info("'Course environment' doesn't contain 'Getting Started'. ***");
    } else {
        opm_info("'Course environment' not found.");
    }

    // find class activity, amend ???

    // Hide getting started section
    // let sec1 = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 1}]}))[0];
    // let sec1_name_san = sec1.name.replace(/\s+/g, " ").trim().toUpperCase();
    if (sec1_name_san.match(/\bGETTING STARTED\b/)) {

        // if (!s0a_part_match) {
        //    opm_info("Getting started not referenced. ***");
        // }

        await ws_call({wsfunction: "core_course_edit_section_by_num_x", action: "hide", courseid: courseid, sectionnum: 1});

        // sec1 = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 2}]}))[0];
    }

}


// TODO:
// Basically on every Programme Page > About this programme (e.g. https://moodle.op.ac.nz/course/view.php?id=5384&section=1)
// within the D4LS Workspace and Programmes will need the bottom line updated from:
// All courses are required. You can access courses you're enrolled in through the Student Hub or by clicking My Moodle > My Courses, above.
// To:
// All courses are required. You can access courses you're enrolled in through the Student Hub or by clicking Home > Courses, above.


async function opm_course_list_replace_my_moodle(start: number): Promise<void> {

    await opm_course_list_for_each(opm_replace_my_moodle, start);

}



async function opm_replace_my_moodle(courseid: number, course_fullname: string): Promise<void> {
    const parser = new DOMParser();

    // Run on the programmes category?

    if (!course_fullname.replace(/\s+/g, " ").trim().toUpperCase().match(/\bPROGRAMME\b/)) {
        return;
    }

    // Get course details
    const course = await ws_call({wsfunction: "core_course_get_course_x", courseid: courseid});

    // Check name and format
    const course_name_san = course.fullname.replace(/\s+/g, " ").trim().toUpperCase();
    if (   course_name_san.match(/\bOLD\b/     )
        || course_name_san.match(/\b201[0-6]\b/) ) {
        opm_info("Skipping old");
        return;
    }
    if (!course_name_san.match(/\bPROGRAMME PAGE\b/)) {  // or programme site?
        opm_info("Skipping partial name match ***");
        return;
    }

    if (course.format != "onetopic") {
        opm_info("Skipping due to course format: " + course.format);
        return;
    }

    // Get section 1
    const s1a               = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 1}]}))[0];
    const s1a_name_san      = s1a.name.replace(/\s+/g, " ").trim().toUpperCase();
    const s1a_summary_san   = (parser.parseFromString(s1a.summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

    // Check section 1 title
    if (s1a_name_san == "ABOUT THIS PROGRAMME" || s1a_name_san == "PROGRAMME STRUCTURE") { /*OK*/ }
    else {
        opm_info("Skipping due to section 1 name: " + s1a.name);
        return;
    }

    // Check for expected text fragment
    const s1a_part_match    = s1a_summary_san.match(/\bCOURSES YOU'RE ENROLLED IN\b/) != null;

    if (s1a_part_match) {

        // Define text  // "\xa0" is non-breaking space

        const s1b_summary_para_old      =   "You can access courses you're enrolled in through the Student Hub "
                                          + "or by clicking <strong>My Moodle</strong> &gt; <strong>My Courses</strong>, above.";
        const s1b_summary_para_old_b    =   "You can access courses you're enrolled in through the Student Hub or by clicking the \"My Courses\" tab, above.";
        //                                  "You can access courses you're enrolled in through the Student Hub or by clicking the \"My Courses\" tab to the left, or above.";
        //                                  "You can access courses you're enrolled in through the Student Hub or by clicking above,&nbsp;<strong>My Moodle</strong> &gt; <strong>My Courses</strong>";
        const s1b_summary_para_new      =   "You can access courses you're enrolled in by clicking on Dashboard, above, or through the Student Hub.";


        // Find and replace paragraph text
        const s1b = await ws_call({wsfunction: "core_course_get_section_x", sectionid: s1a.id});
        let s1b_summary = s1b.summary;

        s1b_summary = s1b_summary.replace(s1b_summary_para_old,   s1b_summary_para_new);
        s1b_summary = s1b_summary.replace(s1b_summary_para_old_b, s1b_summary_para_new);

        if (s1b_summary != s1b.summary) {
            await ws_call({wsfunction: "core_course_update_section_x", section: {id: s1b.id, summary: s1b_summary}});
        } else if (s1b_summary.search(s1b_summary_para_new    ) > -1) {
            /* do nothing */
        } else {
            opm_info("Skipping, paragraph partial match only. ***");
            return;
        }

    } else {
        opm_info("Skipping, 'courses you're enrolled in' not found. ***");
        return;
    }

}



// TODO: Test


async function opm_course_list_replace_font_awesome_attribution(start: number): Promise<void> {

    await opm_course_list_for_each(opm_replace_font_awesome_attribution, start);

}



async function opm_replace_font_awesome_attribution(courseid: number, _course_fullname: string): Promise<void> {
    // const parser = new DOMParser();

    // Run on the programmes category?

    // Get course details
    const course = await ws_call({wsfunction: "core_course_get_course_x", courseid: courseid});

    // Check format
    if (course.format != "onetopic") {
        opm_info("Skipping due to course format: " + course.format);
        return;
    }

    // Get section 0
    const s0a               = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 0}]}))[0];
    // const s0a_name_san      = s0a.name.replace(/\s+/g, " ").trim().toUpperCase();
    // const s0a_summary_san   = (parser.parseFromString(s0a.summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

    let mod_id: number|null = null;
    for (const mod of s0a.modules) {
        if (mod.modname == "label" && mod.description && mod.description.replace(/\s+/g, " ").trim().toUpperCase().match("FONT AWESOME")) {
            if (mod_id) {
                opm_info("Multiple possible matches found. ***");
            }
            mod_id = mod.id;
        }
    }

    if (mod_id) {

        // Define text  // "\xa0" is non-breaking space

        // const mod_para_old_small_a  = '<span style="font-size: xx-small;">Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io</a></span><br>';
        // const mod_para_old_small_b  = '<span style="font-size: xx-small;">Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io</a></span><br />';
        // const mod_para_old_small_c  = '<span style="font-size: xx-small;">Font Awesome by Dave Gandy -&nbsp;<a href="http://fontawesome.io" target="_blank">http://fontawesome.io<br></a></span>';
        // const mod_para_old_small_d  = '<span style="font-size: xx-small;">Font Awesome by Dave Gandy -&nbsp;<a href="http://fontawesome.io" target="_blank">http://fontawesome.io<br /></a></span>';
        const mod_para_old_small_a  = /<span style="font-size: xx-small;">Font Awesome by Dave Gandy -(?:\s|&nbsp;)<a href="http:\/\/fontawesome.io" target="_blank">http:\/\/fontawesome.io<\/a><\/span><br(?: \/)?>/;
        const mod_para_old_small_b  = /<span style="font-size: xx-small;">Font Awesome by Dave Gandy -(?:\s|&nbsp;)<a href="http:\/\/fontawesome.io" target="_blank">http:\/\/fontawesome.io<br(?: \/)?><\/a><\/span>/;
        const mod_para_old_br_span_close = /<br(?: \/)?>(?: )?Font Awesome by Dave Gandy -(?: |&nbsp;)<a href="http:\/\/fontawesome.io" target="_blank">http:\/\/fontawesome.io<\/a><\/span><br(?: \/)?>/;
        const mod_para_old_a        = 'Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io</a><br>';
        const mod_para_old_b        = 'Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io</a><br />';
        const mod_para_old_c        = 'Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io<br></a>';
        const mod_para_old_d        = 'Font Awesome by Dave Gandy - <a href="http://fontawesome.io" target="_blank">http://fontawesome.io<br /></a>';

        const mod_para_new_wo_br    =   'Icons: <a href="http://fontawesome.com/" target="_blank">Font Awesome</a> by Dave Gandy,\n'
                                      + 'licensed under <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank">CC-BY-4.0</a>';


        // Find and replace paragraph text
        const mod = (await ws_call({wsfunction: "core_course_get_course_module", cmid: mod_id})).cm;
        let mod_desc = mod.description                                          || throwf(new Error("Description not found."));

        mod_desc = mod_desc.replace(mod_para_old_a, mod_para_new_wo_br + "<br>");
        mod_desc = mod_desc.replace(mod_para_old_b, mod_para_new_wo_br + "<br>");
        mod_desc = mod_desc.replace(mod_para_old_c, mod_para_new_wo_br + "<br>");
        mod_desc = mod_desc.replace(mod_para_old_d, mod_para_new_wo_br + "<br>");
        mod_desc = mod_desc.replace(mod_para_old_br_span_close, "<br>\n" + mod_para_new_wo_br + "<br></span>");
        mod_desc = mod_desc.replace(mod_para_old_small_a, '<span style="font-size: xx-small;">' + mod_para_new_wo_br + "</span><br>");
        mod_desc = mod_desc.replace(mod_para_old_small_b, '<span style="font-size: xx-small;">' + mod_para_new_wo_br + "</span><br>");

        if (mod_desc != mod.description) {
            await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: mod.id, description: mod_desc}});
        } else if (mod_desc.search(mod_para_new_wo_br) > -1) {
            /* do nothing */
        } else {
            opm_info("Skipping, Font Awesome attribution partial match only. ***");
            return;
        }

    } else {
        opm_info("Skipping, Font Awesome attribution not found.");
        return;
    }

}




async function opm_course_list_change_progress_block(start: number): Promise<void> {

    await opm_course_list_for_each(opm_change_progress_block, start);

}


async function opm_change_progress_block(courseid: number): Promise<void> {
    const parser = new DOMParser();

    // Run on the programmes category?

    // Get course details
    const course = await ws_call({wsfunction: "core_course_get_course_x", courseid: courseid});

    // Check name and format
    const course_name_san = course.fullname.replace(/\s+/g, " ").trim().toUpperCase();
    if (   course_name_san.match(/\bOLD\b/     )
        || course_name_san.match(/\b201[0-6]\b/) ) {
        opm_info("Skipping old course");
        return;
    }
    if (   course_name_san.match(/\bPAGE\b/      )
        || course_name_san.match(/\bSANDPIT\b/   )
        || course_name_san.match(/\bTURNITIN\b/  )
        || course_name_san.match(/\bGLOSSARIES\b/) ) {
        opm_info("Skipping special course");
        return;
    }
    if (course.format != "onetopic") {
        opm_info("Skipping due to course format: " + course.format);
        return;
    }

    // TODO: Check course isn't current?

    // Get first section
    const s0a               = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: 0}]}))[0];
    const s0a_name_san      = s0a.name.replace(/\s+/g, " ").trim().toUpperCase();
    const s0a_summary_san   = (parser.parseFromString(s0a.summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

    // Check first section title
    if (s0a_name_san == "HAERE MAI") { /*OK*/ }
    else {
        opm_info("Skipping due to section 0 name: " + s0a.name);  // TODO: Figure out why got "Topic 0" one time.
        return;
    }

    // Check first section text
    if (    s0a_summary_san.match(/\bTHIS COURSE\b/ )
        && !s0a_summary_san.match(/\bTHIS PROJECT\b/) ) { /*OK*/ }
    else {
        opm_info("Skipping due to section 0 summary");
        return;
    }

    // Find old and new progress blocks
    const old_block_type = "progress";
    const new_block_type = "completion_progress";
    let old_block_count:    number              = 0;
    let new_block_count:    number              = 0;
    let old_block:          WS_Block_1|null     = null;
    let new_block:          WS_Block_1|null     = null;
    const blocks:           WS_Block_1[]        = (await ws_call({wsfunction: "core_block_get_course_blocks", courseid: courseid})).blocks;
    let any_visible:        boolean             = false;
    for (const block of blocks) {
        if (block.visible_x != undefined) { /*OK*/ } else                       { throw new Error("Can't get block visibility."); }
        if (block.name == new_block_type) {
            any_visible     = any_visible || block.visible_x > 0;
            new_block_count += 1;
            new_block       = block;
        } else if (block.name == old_block_type) {
            any_visible     = any_visible || block.visible_x > 0;
            old_block_count += 1;
            old_block       = block;
        }
    }

    // If more than one new block, print info
    if (new_block_count > 1) {
        opm_info("Multiple new blocks ***");
    }

    // If any old blocks, print info
    if (old_block_count > 0) {
        opm_info("Old block ***");
    }

    // Make changes

    // Enable completion tracking for course.
    await ws_call({wsfunction: "core_course_update_courses", courses: [{id: courseid, enablecompletion: 1}]});

    // Disable completion tracking on anything that's not an assignment.
    const tracked_mods: WS_Module_1[] = (await ws_call({wsfunction: "core_course_get_modules_with_completion_x", courseid: courseid})).mods;
    for (const tracked_mod of tracked_mods) {
        if (tracked_mod.modname != "assign" && !tracked_mod.modname.startsWith("turnitintool")) {
            await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: tracked_mod.id, completion: 0}});
        }
    }

    // TODO: Check for access restriction?

    // Enable completion tracking for assignments.
    const assigns:          WS_Mod_Assign[]    = (await ws_call({wsfunction: "mod_assign_get_assignments",
                                                                    courseids: [courseid]})).courses[0].assignments;
    const turnitin_assigns: WS_Mod_Assign[]    = (await ws_call({wsfunction: "mod_assign_get_assignments",
                                                                    courseids: [courseid], modname_x: "turnitintool"})).courses[0].assignments;
    const turnitin2_assigns: WS_Mod_Assign[]   = (await ws_call({wsfunction: "mod_assign_get_assignments",
                                                                    courseids: [courseid], modname_x: "turnitintooltwo"})).courses[0].assignments;
    for (const assignment of assigns) {
        const assign_details    = (await ws_call({wsfunction: "core_course_get_course_module", cmid: assignment.cmid})).cm;
        const assign_completion = (assign_details.assignsubmission_file_enabled_x || assign_details.assignsubmission_onlinetext_enabled_x) ? 2 : 1;
        if (assign_completion == 2) {
            await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: assignment.cmid, completion: 2,
                                                                                  completionview_x: 0, completionusegrade_x: 0, completionsubmit_x: 1}});
        } else {
            await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: assignment.cmid, completion: 1}});
        }
    }
    for (const assignment of turnitin_assigns) {
        await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: assignment.cmid, completion: 1}});
    }
    for (const assignment of turnitin2_assigns) {
        await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: assignment.cmid, completion: 1}});
    }

    // Hide old progress block
    if (old_block != null && old_block.visible_x) {
        await ws_call({wsfunction: "core_block_update_course_block_x", block: {courseid_x: courseid, instanceid: old_block.instanceid, visible_x: 0}});
        // await ws_call({wsfunction: "core_block_delete_course_block_x", courseid: courseid, blockid: old_block.instanceid});
        // old_block = null;
    }

    // Add new progress block, if none
    if (new_block == null) {
        new_block = await ws_call({wsfunction: "core_block_create_course_block_x", block: {courseid_x: courseid, name: new_block_type}});
        new_block_count += 1;

        // Configure
        const make_visible: 0|1                 = (any_visible && (assigns.length + turnitin_assigns.length + turnitin2_assigns.length) > 0) ? 1 : 0;
        const block_update: Partial<WS_Block_1x> & Pick<WS_Block_1x, "courseid_x"|"instanceid"> = {
            courseid_x:           courseid,
            instanceid:           new_block.instanceid,
            defaultweight_x:      -10,
            weight_x:             -10,
            visible_x:            make_visible,
            activitiesincluded_x: "activitycompletion",
        };
        await ws_call({wsfunction: "core_block_update_course_block_x", block: block_update});

    }

    // TODO: remove notes???:

    for (let sec_num = 0; true; sec_num++) {
        let sna: WS_Course_Section_W_Modules|null;
        sna = (await ws_call({wsfunction: "core_course_get_contents", courseid: courseid, options: [{name: "sectionnumber", value: sec_num}]}))[0];
        if (!sna) {
            return;
        }
        const sna_summary_san   = (parser.parseFromString(sna.summary, "text/html").body.textContent || "").replace(/\s+/g, " ").trim().toUpperCase();

        if (sna_summary_san.match(/\bTICK\b/) != null) {

            const snb_summary_paras_old1: string[] = [  // "\xa0" is non-breaking space
                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this topic.&nbsp;"
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",
                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this topic.\xa0"
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",
                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this topic. "
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",

                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this module.&nbsp;"
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",
                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this module.\xa0"
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",
                "<p>You can tick the boxes down the right-hand side of the screen to track your progress through this module. "
                + "Boxes with a dashed border will check themselves when you complete an activity.</p>",

                "<p><em>Tick the boxes down the right-hand side of the screen to track your progress through the course.</em></p>",
                '<p style="text-align: right;"><span><em>Tick the boxes down the right-hand side of the screen to track your progress through the course.</em></span></p>',
                '<p dir="ltr"><em>Tick each of the case studies as you complete them to show your progress on the \'To Do\' bar.</em></p>',
            ];

            const snb_summary_para_old2    = '<p dir="ltr">You can tick the boxes down the right-hand side of the screen to track your progress through this module. '; /* </p> */


            // old '<td style="text-align: right;"><em>Tick the boxes down the right-hand side of the screen to track your progress through the course.</em><em></em>'
            // + '<em><em><a href="https://upload.wikimedia.org/wikipedia/commons/7/72/Tir_parab%C3%B2lic.png" target="_blank"><br></a></em></em></td>'

            // Find and replace paragraph text
            const snb = await ws_call({wsfunction: "core_course_get_section_x", sectionid: sna.id});
            let snb_summary = snb.summary;

            for (const snb_summary_para_old of snb_summary_paras_old1) {
                snb_summary = snb_summary.replace(snb_summary_para_old, "");
            }
            snb_summary = snb_summary.replace(snb_summary_para_old2, "<p>");

            if (snb_summary != snb.summary) {
                await ws_call({wsfunction: "core_course_update_section_x", section: {id: snb.id, summary: snb_summary}});
            } else {
                opm_info("Section intro paragraph partial match only ***: " + (snb.name || snb.section) );
            }

        }

    }



}





async function opm_new_shell(name: string, shortname: string, startdate: number) {  // TODO: Set properties.

    opm_progress.value = 0;
    opm_progress.max = ws_course_restore_loads + ws_course_get_contents_loads + ws_course_section_get_loads + ws_course_section_update_loads + 1;
    let source_course_id: number;
    if (ws_wwwroot == "http://moodleuat.op.ac.nz") {
        source_course_id = 5366;
    } else if (ws_wwwroot == "https://moodle.op.ac.nz") {
        source_course_id = 6548;
    } else                                                                      { throw new Error("Site not recognised."); }
    const target_category: WS_Course_Category_1 = await ws_call({wsfunction: "core_course_get_category_displayed_x"});
    const new_course = await ws_call({wsfunction: "core_course_restore_course_x", courseid: source_course_id,
                    course: {categoryid: target_category.id, fullname: name, shortname: shortname,
                                startdate: startdate}});

    // TODO: Edit course names in first section?  And level? ***
    const new_contents = await ws_call({wsfunction: "core_course_get_contents", courseid: new_course.id
                                                                                || throwf(new Error("Course ID not found."))});
    const new_s0 = await ws_call({wsfunction: "core_course_get_section_x", sectionid: new_contents[0].id});
    await ws_call({wsfunction: "core_course_update_section_x", section: {id: new_s0.id, summary: new_s0.summary.replace("[Course Name]", name)}});

    opm_progress.value = opm_progress.max;
}


async function opm_new_section(name: string, short_name: string) {
    opm_progress.value = 0;
    opm_progress.max =   ws_course_get_contents_loads
                            + ws_course_section_add_loads
                            + ws_course_get_contents_loads * 2
                            + ws_course_section_edit_by_num_loads
                            + ws_course_section_update_loads
                            + ws_module_create_loads * 5
                            + ws_mod_feedback_use_template_loads
                            + 1;

    // TODO: Also customise image link per site
    let feedback_template_id: number;
    if (ws_wwwroot == "http://moodleuat.op.ac.nz") {
        feedback_template_id = 44;
    } else if (ws_wwwroot == "https://moodle.op.ac.nz") {
        feedback_template_id = 59;
    } else                                                                      { throw new Error("Site not recognised."); }

    const course = await ws_call({wsfunction: "core_course_get_course_displayed_x"});
    if (course.format == "onetopic") { /*OK*/ } else                            { throw new Error("Course format unexpected."); }
    const course_sections_1 = await ws_call({wsfunction: "core_course_get_contents", courseid: course.id});
    let sec_modules: number|null = null;
    let sec_after_modules: number|undefined;
    for (const course_section of course_sections_1) {
        if (course_section.name.trim().toUpperCase() == "MODULES") {
            if (sec_modules == null) { /*OK*/ } else                            { throw new Error("More than one Modules section."); }
            sec_modules = course_section.section                                || throwf(new Error("Section number not known."));
        } else if (sec_modules != null && !sec_after_modules) {
            sec_after_modules = course_section.section                          || throwf(new Error("Section number not known."));
        }
    }
    await ws_call({wsfunction: "core_course_add_section_x", courseid: course.id});
    const course_sections_2 = await ws_call({wsfunction: "core_course_get_contents", courseid: course.id});
    const new_section_1 = course_sections_2[course_sections_2.length - 1];
    const new_section_1_num = new_section_1.section                             || throwf(new Error("Section number not known."));
    if (!sec_after_modules) {
        sec_after_modules = new_section_1_num;
    }
    const new_section_2 = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id,
        options: [{name: "sectionnumber", value: new_section_1_num}]}))[0];
    await ws_call({wsfunction: "core_course_edit_section_by_num_x", action: "move_x", value_x: sec_after_modules - new_section_1_num,
        courseid: course.id, sectionnum: new_section_1_num});
    const new_section_2_num = sec_after_modules;
    // const new_section_2 = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id,
    //    options: [{name:"sectionnumber", value: new_section_2_num}]}))[0];
    await ws_call({wsfunction: "core_course_update_section_x", section: {id: new_section_2.id, name: short_name, level_x: 1,
        summary:
        `<div class="header1"><i class="fa fa-list" aria-hidden="true"></i> ${name}</div>

        <br />

        <img src="https://moodle.op.ac.nz/pluginfile.php/812157/course/section/106767/nature-sky-clouds-flowers.jpg" alt="Generic sky" style="float: right; margin-left: 5px; margin-right: 5px;" width="240" height="180" />

        <p>[Intro to the module goes here.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Cras iaculis mollis efficitur.
        Praesent ipsum diam, dignissim et orci et, tempor fringilla lectus.
        Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Proin sed quam pharetra, gravida odio iaculis, fermentum turpis.
        Etiam vel tincidunt justo, at fringilla sem.]</p>

        <p>This module will provide you with information, learning activities, and resources that support your classroom and other aspects (e.g. projects, work experiences) of the course work.</p>

        <p>If this is your first visit, we suggest that you work through each topic in the sequence set out below, starting with <strong>[xxxxxxxxx]</strong>.
        As you work through the topics, please access the learning activities below, as these are an essential part of your learning in this programme.</p>

        <p>We recommend that you visit this module on a regular basis, to complete the activities and to self-test your increasing knowledge and skills.</p>`.replace(/^        /gm, "")}});

    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: new_section_2_num, modname: "label",
        description:
        `<p>After you have worked through all of the above topics, and your facilitator provides you with further information in class,
        you're now ready to demonstrate evidence of what you have learnt in this module.
        Please click on the <strong>Assessments</strong> tab above for further information.</p>`.replace(/^        /gm, "")}});

    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: new_section_2_num, modname: "label", description: ""}});

    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: new_section_2_num, modname: "label",
        description:
        `<p><strong>YOUR FEEDBACK</strong></p>

        <p>We appreciate your feedback about your experience with working through this module.
        Please click the 'Your feedback' link below if you wish to respond to a five-question survey.
        Thanks!</p>`.replace(/^        /gm, "")}});

    const feedback_mod = await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: new_section_2_num, modname: "feedback", name: "Your feedback",
    description:
        `<div class="header2"><i class="fa fa-bullhorn" aria-hidden="true"></i> FEEDBACK</div>
        <div class="textblock">
        <p><strong>DESCRIPTION</strong></p>
        <p>Please help us improve this learning module by answering five questions about your experience. This survey is anonymous.</p>
        </div>`.replace(/^        /gm, "")}});

    // Configure feedback module.
    await ws_call({wsfunction: "mod_feedback_use_template_x", cmid: feedback_mod.id, feedback_template_id: feedback_template_id});

    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: new_section_2_num, modname: "label",
    description:
        `<p></p>

        <p><span style="font-size: xx-small;">
        Image: <a href="https://stock.tookapic.com/photos/12801" target="_blank">Blooming</a>
        by <a href="https://stock.tookapic.com/pawelkadysz" target="_blank">Paweł Kadysz</a>,
        licensed under <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en" target="_blank">CC0</a>
        </span></p>`.replace(/^        /gm, "")}});

    opm_progress.value = opm_progress.max;
}



async function opm_new_topic(name: string) {
    opm_progress.value = 0;
    opm_progress.max =       ws_course_get_contents_loads
                                + (   ws_module_create_loads
                                    + ws_course_get_contents_loads
                                    + ws_module_edit_loads    ) * 3
                                + 1;

    // var doc_details = ws_call_content({wsfunction: "x_doc_get_details"});
    const course = await ws_call({wsfunction: "core_course_get_course_displayed_x"});
    if (course.format == "onetopic") { /*OK*/ } else                            { throw new Error("Course format unexpected."); }
    const section_url = await ws_call_content({id_act: "* get_element_attribute", selector: ".breadcrumb-nav a[href*='section=']", attribute: "href"})
                                                                                || throwf(new Error("Section breadcrumb not found."));
    const section_match = section_url.match(/^(https?:\/\/[a-z\-.]+)\/course\/view.php\?id=(\d+)&section=(\d+)$/)
                                                                                || throwf(new Error("Section number not found."));
    const section_num = parseInt(section_match[3]);

    let section = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id, options: [{name: "sectionnumber", value: section_num}]}))[0];

    let mod_pos = section.modules.length - 1;
    let mod_match_pos = 4;
    // let match_ok = true;

    while (mod_pos > -1 && mod_match_pos > -1) { // } && match_ok) {
        if (mod_match_pos == 4 && section.modules[mod_pos].modname == "label" && section.modules[mod_pos].name.toUpperCase().match(/\bIMAGE\b/)) {
            mod_match_pos -= 1;
            mod_pos -= 1;
        } else if (mod_match_pos == 4) {
            mod_match_pos -= 1;
        } else if (mod_match_pos == 3 && section.modules[mod_pos].modname == "feedback" && section.modules[mod_pos].name.toUpperCase().match(/\bFEEDBACK\b/)) {
            mod_match_pos -= 1;
            mod_pos -= 1;
        } else if (mod_match_pos == 2 && section.modules[mod_pos].modname == "label" && section.modules[mod_pos].name.toUpperCase().match(/\bFEEDBACK\b/)) {
            mod_match_pos -= 1;
            mod_pos -= 1;
        } else if (mod_match_pos == 1 && section.modules[mod_pos].modname == "label" && section.modules[mod_pos].name.trim() == "") {
            mod_match_pos -= 1;
            mod_pos -= 1;
        } else if (mod_match_pos == 0 && section.modules[mod_pos].modname == "label" && section.modules[mod_pos].name.replace(/\s+/g, " ").toUpperCase().match(/\bASSESSMENTS TAB\b/)) {
            mod_match_pos -= 1;
            mod_pos -= 1;
        } else {
            break;
            // match_ok = false;
        }
    }

    if (mod_match_pos < 0) { /*OK*/ } else                                      { throw new Error("Expected last modules not found."); }

    const mod_move_to = section.modules[mod_pos + 1].id;

    const topic_first = mod_pos < 0 ? true : false;

    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: section_num, modname: "label",
    description: topic_first ?
        `<div class="header2"><i class="fa fa-align-justify" aria-hidden="true"></i> ${name}</div>

        <div class="textblock">

        <p>In class, your facilitator will introduce you to
        [introduce the topic here, including learning objectives.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]
        The online activities listed below support the course work.</p>

        <p><strong>INSTRUCTIONS</strong></p>

        <p>Your facilitator will provide you with information about completing the following activities.
        We suggest that you work through each activity in the sequence set out below, from top to bottom -
        but feel free to complete the activities in the sequence that makes the most sense to you.</p>

        </div>`.replace(/^        /gm, "") :
        `<div class="header2"><i class="fa fa-align-justify" aria-hidden="true"></i> ${name}</div>

        <div class="textblock">

        <p>In class, your facilitator will introduce you to
        [introduce the topic here, including learning objectives.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]
        The online activity listed below supports the course work.</p>

        <p><strong>INSTRUCTIONS</strong></p>

        <p>Your facilitator will provide you with information about completing the following activity.</p>

        </div>`.replace(/^        /gm, ""),
    }});


    section = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id, options: [{name: "sectionnumber", value: section_num}]}))[0];

    // TODO: Move new module.
    await ws_call({wsfunction: "core_course_edit_module", id: section.modules[section.modules.length - 1].id, action: "moveto_x", value_x: mod_move_to});


    if (topic_first) {
        await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: section_num, modname: "label", description:
        `<p>When you have completed the above activities, and your facilitator provides you with further information, please continue to the next topic below -
        <strong>[xxxxxxx]</strong>.</p>`}});

        section = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id, options: [{name: "sectionnumber", value: section_num}]}))[0];

        // TODO: Move new module.
        await ws_call({wsfunction: "core_course_edit_module", id: section.modules[section.modules.length - 1].id, action: "moveto_x", value_x: mod_move_to});

    } else {
        ws_load_count(ws_module_create_loads + ws_course_get_contents_loads + ws_module_edit_loads);
    }



    await ws_call({wsfunction: "core_course_create_module_x", cm: {course: course.id, sectionnum: section_num, modname: "label", description: ""}});

    section = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id, options: [{name: "sectionnumber", value: section_num}]}))[0];

    // TODO: Move new module.
    await ws_call({wsfunction: "core_course_edit_module", id: section.modules[section.modules.length - 1].id, action: "moveto_x", value_x: mod_move_to});

    opm_progress.value = opm_progress.max;
}





async function opm_index_rebuild() {

    // TODO: Don't include hidden tabs or topic headings?

    opm_progress.value = 0;
    opm_progress.max = ws_course_get_contents_loads * 12 + ws_module_update_loads + 1;

    const parser = new DOMParser();

    // Get course id
    const course = await ws_call({wsfunction: "core_course_get_course_displayed_x"});
    if (course.format == "onetopic") { /*OK*/ } else                            { throw new Error("Course not onetopic format."); }

    // Find Modules tab number
    const course_contents = await ws_call({wsfunction: "core_course_get_contents", courseid: course.id});
    let modules_tab_num: number|undefined|null = null;
    for (const section of course_contents) {
        if (section.name.toUpperCase().trim() == "MODULES") {
            if (modules_tab_num == null) {
                modules_tab_num = section.section;
            } else                                                              { throw new Error("Two module sections found."); }
        }
    }
    if (modules_tab_num) { /*OK*/ } else                                        { throw new Error("Modules section not found"); }

    // Get list of modules
    const modules_list = await ws_call({wsfunction: "core_course_get_contents", courseid: course.id,
                                        options: [{name: "sectionnumber", value: modules_tab_num}, {name: "include_nested_x", value: true}]});

    if (modules_list[0].modules.length == 1) { /*OK*/ } else                    { throw new Error("Expected exactly one resource in Modules tab."); }

    const modules_index = modules_list[0].modules[0];

    opm_progress.max = ws_course_get_contents_loads * (modules_list.length + 1) + ws_module_update_loads + 1;

    let index_html = '<div class="textblock">\n';

    modules_list.shift();

    for (const section of modules_list) {
        const section_num = section.section                                     || throwf(new Error("Module number not found."));
        const section_full = (await ws_call({wsfunction: "core_course_get_contents", courseid: course.id, options: [{name: "sectionnumber", value: section_num}]}))[0];
        const section_name = (parser.parseFromString(section_full.summary, "text/html").querySelector(".header1")
                                                                                || throwf(new Error("Module name not found."))
                             ).textContent                                      || throwf(new Error("Module name content not found."));

        index_html = index_html
                    + '<a href="' + ws_wwwroot + "/course/view.php?id=" + course.id + "&section=" + section_num + '"><b>' + escapeHTML(section_name.trim()) + "</b></a>\n"
                    + "<ul>\n";

        for (const mod of section_full.modules) {

            // parse description
            const mod_desc = parser.parseFromString(mod.description || "", "text/html");
            const part_name = mod_desc.querySelector(".header2, .header2gradient");
            if (part_name) {
                index_html = index_html
                            + "<li>"
                            + escapeHTML((part_name.textContent                 || throwf(new Error("Couldn't get text content."))
                              ).trim())
                            + "</li>\n";
            }

        }

        index_html = index_html
                    + "</ul>\n"
                    + "<br />\n";
    }

    index_html = index_html
                + "</div>\n";

    await ws_call({wsfunction: "core_course_update_course_module_x", cm: {id: modules_index.id, description: index_html}});

    opm_progress.value = opm_progress.max;

}



// TODO: display tagged courses???
