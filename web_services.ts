/*
 * Moodle JS Web Services
 * Provides something resembling the Moodle Web Services API.  Loaded in the panel.
 */


function sleep(time: number): Promise<{}> { return new Promise((resolve) => setTimeout(resolve, time)); }
function throwf(err: Error): never                                              { throw err; }
function never_call(_never_var: never): never /* Shouldn't ever happen */       { throw new Error("WS never call, unexpected case."); }


// TODO: Replace search.match with URLSearchParams?



function ws_json_to_search_params(message: Object, key_prefix: string = ""): string { // USE URLSearchParams?
    let result: string = "";
    if (message instanceof Array) {
        for (let count = 0; count < message.length; count += 1) if (message[count] != undefined) {
            const key =  key_prefix + (key_prefix ? "[" : "") + count + (key_prefix ? "]" : "");
            result += (result ? "&" : "")
                    + (message[count] instanceof Object ? ws_json_to_search_params(message[count], key) : key + "=" + message[count]);
        }
    } else {
        for (const prop in message ) if (message.hasOwnProperty(prop) && (message as {[index: string]: any})[prop] != undefined) {
            const key = key_prefix + (key_prefix ? "[" : "") + prop + (key_prefix ? "]" : "");
            const message_prop = (message as {[index: string]: any})[prop];
            result += (result ? "&" : "")
                    + (message_prop instanceof Object ? ws_json_to_search_params(message_prop, key) : key + "=" + message_prop);
        }
    }
    return result;
}



/*
 * Call the actual WS API
 */


async function ws_call_fetch(message: Object): Promise<any> {
    const response = await fetch(ws_wwwroot + "/webservice/rest/server.php?" + ws_json_to_search_params(message));
    if (response.ok) { /* OK */ } else                                          { throw(new Error(response.statusText)); }
    const response_json = await response.json();
    if (typeof response_json == "object" && response_json.exception)            { throw(new Error(response_json.message)); }
    return response_json;
}


/*
 * Global Variables
 */


let ws_wwwroot:             string;
let ws_sesskey:             string;
let ws_ext_content_tab_id:  number;
let ws_page_details:        WS_Page_Details;
let ws_load_tries:          number  = 0;
let ws_load_checks:         number  = 0;
let ws_load_bar:            HTMLProgressElement;


/*
 * Init Function
 */


async function ws_init(tab_id: number, bar: HTMLProgressElement): Promise<boolean> {
    ws_ext_content_tab_id = tab_id;
    ws_load_bar = bar;
    ws_page_details = await ws_call_content({id_act: "* get_details"});
    ws_wwwroot = ws_page_details.location_origin;
    ws_sesskey = ws_page_details.site_sesskey;
    return true;
}



/*
 * Messaging
 */


// type WS_Message_Abstract = {wsfunction: string};


type WS_Message = /* WS_Message_Abstract & */ (

    // Block
      WS_Block_Create_Message
    | WS_Block_Delete_Message
    | WS_Block_Update_Message

    // Course
    | WS_Course_Get_Blocks_Message
    | WS_Course_Get_Contents_Message
    | WS_Course_Get_Message
    | WS_Course_Get_Displayed_Message
    | WS_Course_Get_Modules_With_Completion_Message
    | WS_Course_Restore_Message
    | WS_Courses_Update_Message
    | WS_Course_View_Message
    | WS_Course_Get_Enrolled_Users_Message
    | WS_Course_Get_Assigns_Message

    // Course Category
    | WS_Course_Category_Get_Message
    | WS_Course_Category_Get_Displayed_Message
    | WS_Course_Category_Get_Displayed_Courses_Message

    // Course Section
    | WS_Course_Section_Add_Message
    | WS_Course_Section_Delete_Message
    | WS_Course_Section_Edit_By_Num_Message
    | WS_Course_Section_Get_Message
    | WS_Course_Section_Update_Message

    // Module
    | WS_Module_Create_Message
    | WS_Module_Edit_Message
    | WS_Module_Get_Message
    | WS_Module_Update_Message
    | WS_Mod_Feedback_Use_Template_Message);


type WS_Response =

    // Block
      WS_Block_Create_Response
    | WS_Block_Delete_Response
    | WS_Block_Update_Response

    // Course
    | WS_Course_Get_Blocks_Response
    | WS_Course_Get_Contents_Response
    | WS_Course_Get_Response
    | WS_Course_Get_Displayed_Response
    | WS_Course_Get_Modules_With_Completion_Response
    | WS_Course_Restore_Response
    | WS_Courses_Update_Response
    | WS_Course_View_Response
    | WS_Course_Get_Enrolled_Users_Response
    | WS_Course_Get_Assigns_Response

    // Course Category
    | WS_Course_Category_Get_Response
    | WS_Course_Category_Get_Displayed_Response
    | WS_Course_Category_Get_Displayed_Courses_Response

    // Course Section
    | WS_Course_Section_Add_Response
    | WS_Course_Section_Delete_Response
    | WS_Course_Section_Edit_By_Num_Response
    | WS_Course_Section_Get_Response
    | WS_Course_Section_Update_Response

    // Module
    | WS_Module_Create_Response
    | WS_Module_Edit_Response
    | WS_Module_Get_Response
    | WS_Module_Update_Response
    | WS_Mod_Feedback_Use_Template_Response;


// Block
async function ws_call(message: WS_Block_Create_Message):                       Promise<WS_Block_Create_Response>;
async function ws_call(message: WS_Block_Delete_Message):                       Promise<WS_Block_Delete_Response>;
async function ws_call(message: WS_Block_Update_Message):                       Promise<WS_Block_Update_Response>;

// Course
async function ws_call(message: WS_Course_Get_Blocks_Message):                  Promise<WS_Course_Get_Blocks_Response>;
async function ws_call(message: WS_Course_Get_Contents_Message):                Promise<WS_Course_Get_Contents_Response>;
async function ws_call(message: WS_Course_Get_Message):                         Promise<WS_Course_Get_Response>;
async function ws_call(message: WS_Course_Get_Displayed_Message):               Promise<WS_Course_Get_Displayed_Response>;
async function ws_call(message: WS_Course_Get_Modules_With_Completion_Message): Promise<WS_Course_Get_Modules_With_Completion_Response>;
async function ws_call(message: WS_Course_Restore_Message):                     Promise<WS_Course_Restore_Response>;
async function ws_call(message: WS_Courses_Update_Message):                     Promise<WS_Courses_Update_Response>;
async function ws_call(message: WS_Course_View_Message):                        Promise<WS_Course_View_Response>;
async function ws_call(message: WS_Course_Get_Enrolled_Users_Message):          Promise<WS_Course_Get_Enrolled_Users_Response>;
async function ws_call(message: WS_Course_Get_Assigns_Message):                 Promise<WS_Course_Get_Assigns_Response>;

// Course Category
async function ws_call(message: WS_Course_Category_Get_Message):                Promise<WS_Course_Category_Get_Response>;
async function ws_call(message: WS_Course_Category_Get_Displayed_Message):      Promise<WS_Course_Category_Get_Displayed_Response>;
async function ws_call(message: WS_Course_Category_Get_Displayed_Courses_Message): Promise<WS_Course_Category_Get_Displayed_Courses_Response>;

// Course Section
async function ws_call(message: WS_Course_Section_Add_Message):                 Promise<WS_Course_Section_Add_Response>;
async function ws_call(message: WS_Course_Section_Delete_Message):              Promise<WS_Course_Section_Delete_Response>;
async function ws_call(message: WS_Course_Section_Edit_By_Num_Message):         Promise<WS_Course_Section_Edit_By_Num_Response>;
async function ws_call(message: WS_Course_Section_Get_Message):                 Promise<WS_Course_Section_Get_Response>;
async function ws_call(message: WS_Course_Section_Update_Message):              Promise<WS_Course_Section_Update_Response>;

// Module
async function ws_call(message: WS_Module_Create_Message):                      Promise<WS_Module_Create_Response>;
async function ws_call(message: WS_Module_Edit_Message):                        Promise<WS_Module_Edit_Response>;
async function ws_call(message: WS_Module_Get_Message):                         Promise<WS_Module_Get_Response>;
async function ws_call(message: WS_Module_Update_Message):                      Promise<WS_Module_Update_Response>;
async function ws_call(message: WS_Mod_Feedback_Use_Template_Message):          Promise<WS_Mod_Feedback_Use_Template_Response>;


async function ws_call(message: WS_Message):                                    Promise<WS_Response> {
    switch (message.wsfunction) {

    // Block
    case "core_block_create_course_block_x":            return await  ws_block_create(message);
    case "core_block_delete_course_block_x":            return await  ws_block_delete(message);
    case "core_block_update_course_block_x":            return await  ws_block_update(message);

    // Course
    case "core_block_get_course_blocks":                return await  ws_course_get_blocks(message);
    case "core_course_get_contents":                    return await  ws_course_get_contents(message);
    case "core_course_get_course_x":                    return await  ws_course_get(message);
    case "core_course_get_course_displayed_x":          return await  ws_course_get_displayed(message);
    case "core_course_get_modules_with_completion_x":   return await  ws_course_get_modules_with_completion(message);
    case "core_course_restore_course_x":                return await  ws_course_restore(message);
    case "core_course_update_courses":                  return await  ws_courses_update(message);
    case "core_course_view_course":                     return await  ws_course_view(message);
    case "core_enrol_get_enrolled_users":               return await  ws_course_get_enrolled_users(message);
    case "mod_assign_get_assignments":                  return await  ws_course_get_assigns(message);

    // Course Category
    case "core_course_get_category_x":                  return await  ws_course_category_get(message);
    case "core_course_get_category_displayed_x":        return await  ws_course_category_get_displayed(message);
    case "core_course_get_courses_displayed_x":         return await  ws_course_category_get_displayed_courses(message);

    // Course Section
    case "core_course_add_section_x":                   return await  ws_course_section_add(message);
    case "core_course_delete_section_x":                return await  ws_course_section_delete(message);
    case "core_course_edit_section_by_num_x":           return await  ws_course_section_edit_by_num(message);
    case "core_course_get_section_x":                   return await  ws_course_section_get(message);
    case "core_course_update_section_x":                return await  ws_course_section_update(message);

    // Module
    case "core_course_create_module_x":                 return await  ws_module_create(message);
    case "core_course_edit_module":                     return await  ws_module_edit(message);
    case "core_course_get_course_module":               return await  ws_module_get(message);
    case "core_course_update_course_module_x":          return await  ws_module_update(message);
    case "mod_feedback_use_template_x":                 return await  ws_mod_feedback_use_template(message);

    default:                                            return never_call(message);
    }
}



// Generic Page
async function ws_call_content(message: WSC_Page_Ping_Message):                 Promise<WSC_Page_Ping_Response>;
async function ws_call_content(message: WSC_Page_Get_Details_Message):          Promise<WSC_Page_Get_Details_Response>;
async function ws_call_content(message: WSC_Page_Get_Element_Attribute_Message): Promise<WSC_Page_Get_Element_Attribute_Response>;
async function ws_call_content(message: WSC_Page_Set_Element_Attribute_Message): Promise<WSC_Page_Set_Element_Attribute_Response>;
async function ws_call_content(message: WSC_Page_Edit_Element_Message):         Promise<WSC_Page_Edit_Element_Response>;

// Block
async function ws_call_content(message: WSC_Block_Edit_Set_Message):            Promise<void>;

// Course
async function ws_call_content(message: WSC_Course_View_Get_Blocks_Message):    Promise<WSC_Course_View_Get_Blocks_Response>;
async function ws_call_content(message: WSC_Course_View_Get_Contents_Message):  Promise<WSC_Course_View_Get_Contents_Response>;
async function ws_call_content(message: WSC_Course_Edit_Get_Message):           Promise<WSC_Course_Edit_Get_Response>;
async function ws_call_content(message: WSC_Course_Completion_Get_Message):     Promise<WSC_Course_Completion_Get_Response>;
async function ws_call_content(message: WSC_Course_Edit_Set_Message):           Promise<WSC_Course_Edit_Set_Response>;
async function ws_call_content(message: WSC_Course_Enrolled_Users_Get_Message): Promise<WSC_Course_Enrolled_Users_Get_Response>;
async function ws_call_content(message: WSC_Course_Assigns_Get_Message):        Promise<WSC_Course_Assigns_Get_Response>;

// Course Category
async function ws_call_content(message: WSC_Course_Category_Edit_Get_Message):  Promise<WSC_Course_Category_Edit_Get_Response>;
async function ws_call_content(message: WSC_Course_Category_Index_Get_Message): Promise<WSC_Course_Category_Index_Get_Response>;
async function ws_call_content(message: WSC_Course_Category_Index_Get_Courses_Message): Promise<WSC_Course_Category_Index_Get_Courses_Response>;

// Course Section
async function ws_call_content(message: WSC_Course_Section_Edit_Get_Message):   Promise<WSC_Course_Section_Edit_Get_Response>;
async function ws_call_content(message: WSC_Course_Section_Edit_Set_Message):   Promise<WSC_Course_Section_Edit_Set_Response>;

// Module
async function ws_call_content(message: WSC_Module_Edit_Get_Message):           Promise<WSC_Module_Edit_Get_Response>;
async function ws_call_content(message: WSC_Module_Edit_Set_Message):           Promise<WSC_Module_Edit_Set_Response>;

async function ws_call_content(message: WSC_Message):                           Promise<WSC_Response> {

        // Check if the content scripts are loaded
        let script_loaded: boolean|void = false;
        try {
            script_loaded = (await browser.tabs.sendMessage(ws_ext_content_tab_id, {id_act: "* ping"} as WSC_Page_Ping_Message)) as WSC_Page_Ping_Response|void;
            if (   typeof script_loaded == "boolean" && script_loaded
                || script_loaded == undefined /*Firefox 57*/) { /*OK*/ } else   { throw new Error("WS call content, ping response unexpected."); }
        } catch (err) {
            if (err.message == "Could not establish connection. Receiving end does not exist." /*Chrome 63*/) { /*OK*/ }
            else                                                                { throw err; }
        }

        // Load the content scripts if necessary
        if (!script_loaded) {
            let script_loaded_array = await browser.tabs.executeScript(ws_ext_content_tab_id, {file: "browser-polyfill.js"});
            if (script_loaded_array.length == 1 && (   script_loaded_array[0] == undefined
                                                    || script_loaded_array[0] == null     ) ) { /*OK*/ }
            else                                                                { throw new Error("WS call content, polyfill load response unexpected."); }
            script_loaded_array = await browser.tabs.executeScript(ws_ext_content_tab_id, {file: "web_services_content.js"});
            if (script_loaded_array.length == 1 && (   typeof script_loaded_array[0] == "object" && script_loaded_array[0]
                                                    && (script_loaded_array[0] as Partial<{status: boolean}>).status)     ) { /*OK*/ }
            else                                                                { throw new Error("WS call content, script load response unexpected."); }
            script_loaded = true;
        }

        // Call the content script
        return (await browser.tabs.sendMessage(ws_ext_content_tab_id, message)) as WSC_Response;
}




/*
 * Load content page
 */


async function ws_load_content(pathname: string, search: Object,
                                body_id_start: string, body_class: {[index: string]: string|number},
                                count: number = 1, ignore_error?: string): Promise<void> {
    if (pathname.match(/(?:\/[a-z]+)+\.php/)) { /* OK */ } else                 { throw new Error("WS load, pathname unexpected"); }
    await browser.tabs.update(ws_ext_content_tab_id, {url: ws_wwwroot + pathname + "?" + ws_json_to_search_params(search)});
    await ws_loaded_content(body_id_start, body_class, count, ignore_error);
}


async function ws_loaded_content(body_id_start: string, body_class: {[index: string]: string|number}, count: number = 1, ignore_error?: string): Promise<void> {
    ws_load_tries  = 0;
    ws_load_checks = 0;
   do {
        if (ws_load_tries < 600) { /*OK*/ } else                                { throw new Error("WS loaded, timed out."); }
        await sleep(100);
        const tab: browser.tabs.Tab = await browser.tabs.get(ws_ext_content_tab_id);
        if (tab.status == "loading") {
            ws_load_checks = 0;
        } else if (tab.status == "complete") {
            ws_load_checks += 1;
        } else                                                                  { throw new Error("WS loaded, page status not recognised."); }
        ws_load_tries += 1;
        if (ws_load_tries <= count * 30) {  // Assume a step takes 3 seconds
            ws_load_count(1 / 30);
        }
    } while (ws_load_checks < 11);  // Wait until status has been on "complete" for 1 second
    if (ws_load_tries <= count * 30) {
        ws_load_count(count - ws_load_tries / 30);
    }
    ws_page_details = await ws_call_content({id_act: "* get_details", ignore_error: ignore_error});
    // TODO: Check doc details (wwwroot and sesskey?), and throw Moodle errors?
    if (ws_load_match(body_id_start, body_class)) { /* OK */ } else             { throw new Error("WS loaded, body id or class unexpected."); }
}


function ws_load_count(count: number = 1): void {
    ws_load_bar.value += count;
}


function ws_load_match(body_id_start: string, body_class: {[index: string]: string|number}): boolean {
    let result = true;
    if (ws_page_details.body_id.startsWith(body_id_start)) { /* OK */ } else    { result = false; }
    for (const prop in body_class) if (body_class.hasOwnProperty(prop)) {
        if ((" " + ws_page_details.body_class + " ").match(" " + prop + (body_class[prop] ? ("-" + body_class[prop]) : "") + " ")) { /* OK */ }
        else                                                                    { result = false; }
    }
    return result;
}


/*
 * Abstract Moodle object
 */


type WS_Object = {
    // [key: string]: number | string | WS_Object | WS_Object[] | undefined;
};


type WS_Generic_Object = {
    [key: string]: number | string | WS_Object | WS_Generic_Object[] | undefined;
};


/*
 * Block
 */


 // Note: Block calls don't work with single activity format course.

type WS_Block_0 = WS_Object & {
    // Key
    readonly instanceid:    number,
};


type WS_Block_1 = WS_Block_0 & {
    // Constant
    readonly name:          string,

    // Variable
    region:                 "side-pre"|"side-post",
    // positionid:          number,
    // collapsible:         0|1,
    // dockable:            0|1,

    // Methods
    // core_block_get_course_blocks response

    // Extra variable
    title_x?:               string,
    visible_x:              0|1,
};


type WS_Block_1x = WS_Block_1 & {
    // Extra constant
    readonly courseid_x:      number,

    // Extra variable
    defaultregion_x:        "side-pre"|"side-post",
    defaultweight_x:        number,
    weight_x:               number,

    // Progress completion block extra variable
    activitiesincluded_x?:  "activitycompletion"|"selectedactivities",
};


/*
 * Block: Create
 * Note:  Creates a block of the specified type, but with default settings.  Specified settings are not applied.
 */


type WS_Block_Create_Message    = { wsfunction: "core_block_create_course_block_x", block: Partial<WS_Block_1x> & Pick<WS_Block_1x, "courseid_x" | "name"> };
type WS_Block_Create_Response   = WS_Block_1;


async function ws_block_create(message: WS_Block_Create_Message): Promise<WS_Block_Create_Response> {

    // Get IDs of existing blocks
    const blocks_old     = (await ws_call({wsfunction: "core_block_get_course_blocks", courseid: message.block.courseid_x})).blocks;
    const blocks_ids_old = new Set();
    for (const block_old of blocks_old) {
        blocks_ids_old.add(block_old.instanceid);
    }

    // Create new block
    await ws_load_content("/course/view.php", {id: message.block.courseid_x, sesskey: ws_sesskey, bui_addblock: message.block.name},
                            "page-course-view-"/*[a-z]+*/, {course: message.block.courseid_x});

    // Return new block details  // TODO: Return full details
    const blocks_new = (await ws_call({wsfunction: "core_block_get_course_blocks", courseid: message.block.courseid_x})).blocks;
    let block_created: WS_Block_1|null = null;
    for (const block_new of blocks_new) {
       if (!blocks_ids_old.has(block_new.instanceid)) {
           if (!block_created) { /*OK*/ } else                                  { throw new Error("WS block create, more than one new block found."); }
           block_created = block_new;
       }
    }
    if (block_created) { /*OK*/ } else                                          { throw new Error("WS block create, new block not found."); }
    return block_created;
}
const ws_block_create_loads = 3;


/*
 * Block: Delete
 */


type WS_Block_Delete_Message  = { wsfunction: "core_block_delete_course_block_x", courseid: number, blockid: number };
type WS_Block_Delete_Response = void;


async function ws_block_delete(message: WS_Block_Delete_Message): Promise<WS_Block_Delete_Response> {
    const courseid = message.courseid;
    const blockid  = message.blockid;

    // Switch to course
    await ws_call({wsfunction: "core_course_view_course", courseid: courseid});

    // Delete block
    await ws_load_content("/course/view.php", {id: courseid, sesskey: ws_sesskey, bui_deleteid: blockid, bui_confirm: 1},
                        "page-course-view-"/*[a-z]+*/, {course: courseid});

}
const ws_block_delete_loads = 2;


/*
 * Block: Update
 */


type WS_Block_Update_Message  = { wsfunction: "core_block_update_course_block_x", block: Partial<WS_Block_1x> & Pick<WS_Block_1x, "courseid_x"|"instanceid">};
type WS_Block_Update_Response = void;


async function ws_block_update(message: WS_Block_Update_Message): Promise<WS_Block_Update_Response> {

    // Get parameters
    const block = message.block;

    // Load course page
    await ws_call({wsfunction: "core_course_view_course", courseid: block.courseid_x});

    // Load block edit page
    await ws_load_content("/course/view.php", {id: block.courseid_x, sesskey: ws_sesskey, bui_editid: block.instanceid},
                            "page-course-view", {course: block.courseid_x}
    );

    // Make changes
    await ws_call_content({id_act: "page-course-view set_block", block: message.block});
    await ws_loaded_content("page-course-view-"/*[a-z]+*/, {course: block.courseid_x});

}
const ws_block_update_loads = 3;


/*
 * Course
 */


type WS_Course_0 = WS_Object & {
    // Key
    readonly id:        number;

    // Methods
    // core_course_get_activities_overview response deprecated
    // core_course_get_user_administration_options response
    // core_course_get_user_navigation_options response
};


// Course 0.5
    // Variables
    // shortname:       string;     // No default

    // Methods
    // core_course_create_courses response
    // core_course_duplicate_course response


type WS_Course_1 = WS_Course_0 & {
    // Variables
    fullname:           string;     // No default

    // Methods
    // core_enrol_get_enrolled_users response enrolledcourses
    // core_enrol_get_enrolled_users_with_capability response enrolledcourses
    // core_message_data_for_messagearea_search_users response courses
    // core_user_get_course_user_profiles response enrolledcourses
    // mod_assign_list_participants response enrolledcourses
    // core_course_duplicate_course argument partial -key +dont_retain_on_copy +others
    // core_course_search_courses response +others
    // mod_assign_get_assignments response +others
};


type WS_Course_2 = WS_Course_1 & {
    // Course 0.5 Variables
    shortname:          string;

    // Variables
    // idnumber?:       string;
    // summary:         string;
    // summaryformat:   0|1|2|4;
    startdate:          number;     // TODO: Implement
    // enddate:         number;

    // Methods
    // core_calendar_... x9                    +9f cal
    // report_competency_data_for_report... x2 +9f cal
    // tool_lp_data... x7                      +9f cal

    // Course 4 Variables
    categoryid:         number;     // Don't retain on copy
};

type WS_Course_3 = WS_Course_1 & {   // TODO: Should extend WS_Course_2
    // Variables
    // visible?:        0|1;        // Default to 1, Don't retain on copy
    format:             string;
    // showgrades?:     0|1;
    // lang?:           string;
    enablecompletion?:  0|1;

    // Methods
    // core_enrol_get_users_courses response +others
};


// Course 4
    // Variables
    // categoryid

    // Calculated
    // readonly timemodified?: number;

    // Methods
    // core_course_get_courses_by_field +others

// Course 5
    // Methods
    // core_course_create_courses -key -cal
    // core_course_update_courses partial -cal
    // core_course_get_courses +others


/*
 * Course: Get Blocks
 */


type WS_Course_Get_Blocks_Message  = { wsfunction: "core_block_get_course_blocks", courseid: number };
type WS_Course_Get_Blocks_Response = { blocks: WS_Block_1[] };

// Doesn't work with single-activity course
// Invisible blocks are included in the response (unlike WS API)?
// The flag visible_x is not set correctly when fetching from demo.moodle.org

async function ws_course_get_blocks(message: WS_Course_Get_Blocks_Message): Promise<WS_Course_Get_Blocks_Response> {

    // Switch to course
    await ws_call({wsfunction: "core_course_view_course", courseid: message.courseid});

    // Get blocks
    return await ws_call_content({id_act: "page-course-view-* get_blocks"});
}
const ws_course_get_blocks_loads = 1;



/*
 * Course: Get Contents
 */


type WS_Course_Get_Contents_Message  = { wsfunction: "core_course_get_contents", courseid: number, options?: WS_Course_Get_Contents_Option[] };
type WS_Course_Get_Contents_Response = WS_Course_Section_W_Modules[];


type WS_Course_Get_Contents_Option =
//       { name: "excludemodules",  value: boolean }
//     | { name: "excludecontents", value: boolean }
//     | { name: "sectionid",       value: number  }
      { name: "sectionnumber",   value: number  }
//     | { name: "cmid",            value: number  }
//     | { name: "modname",         value: string  }
//     | { name: "modid",           value: number  }
    | { name: "include_nested_x", value: boolean };


async function ws_course_get_contents(message: WS_Course_Get_Contents_Message): Promise<WS_Course_Get_Contents_Response> {
    const courseid  = message.courseid;
    const options   = message.options   || [];
    let sectionnumber: number = 0;  // TODO: Different behaviour for 0 and undefined?
    // let include_nested: boolean = false;
    for (const option of options) {
        switch (option.name) {
            case "sectionnumber":
                sectionnumber = option.value;
                break;
            case "include_nested_x":
                // include_nested = option.value;
                break;
            default:
                never_call(option);
        }
    }

    try {
        await ws_call({wsfunction: "core_course_view_course", courseid: courseid, sectionnumber: sectionnumber});
    } catch (err) {
        if (err.message == "This section does not exist") {
            return [];
        } else                                                                  { throw err; }
    }

    return await ws_call_content({id_act: "page-course-view-* get_contents", options: message.options});

}
const ws_course_get_contents_loads = 1;





/*
 * Course Get
 */

// TODO: Test


type WS_Course_Get_Message  = { wsfunction: "core_course_get_course_x", courseid: number };
type WS_Course_Get_Response = WS_Course_3;


async function ws_course_get(message: WS_Course_Get_Message): Promise<WS_Course_Get_Response> {
    const course_id = message.courseid;

    // Load course edit page
    await ws_load_content("/course/edit.php", {id: course_id},
                            "page-course-edit", {course: course_id},
    );

    // Return course details
    return await ws_call_content({id_act: "page-course-edit get"});

}
const ws_course_get_loads = 1;





/*
 * Course Get Displayed
 */


// TODO: Test


type WS_Course_Get_Displayed_Message  = { wsfunction: "core_course_get_course_displayed_x" };
type WS_Course_Get_Displayed_Response = WS_Course_3;


async function ws_course_get_displayed(_message: WS_Course_Get_Displayed_Message):
                                                       Promise<WS_Course_Get_Displayed_Response> {
    ws_page_details = await ws_call_content({id_act: "* get_details"});

    return {
        id:         parseInt((ws_page_details.body_class.match(/\bcourse-(\d+)\b/) || throwf(new Error("WS course get displayed, course id not found."))
                             )[1]),
        fullname:   await ws_call_content({id_act: "* get_element_attribute", selector: ":root .breadcrumb a[title]", attribute: "title"}) || "",
        format:     (ws_page_details.body_class.match(/\bformat-([a-z]+)\b/)    || throwf(new Error("WS course get displayed, course format not found."))
                    )[1],
    };
}
const ws_course_get_displayed_loads = 0;




/*
 * Course Get Modules with Completion
 */


type WS_Course_Get_Modules_With_Completion_Message  = { wsfunction: "core_course_get_modules_with_completion_x", courseid: number };
type WS_Course_Get_Modules_With_Completion_Response = { mods: WS_Module_1[] };


async function ws_course_get_modules_with_completion(message: WS_Course_Get_Modules_With_Completion_Message):
                                                             Promise<WS_Course_Get_Modules_With_Completion_Response> {

    await ws_load_content(
        "/course/completion.php", {id: message.courseid},
        "page-course-completion", {course: message.courseid},
    );

    return await ws_call_content({id_act: "page-course-completion get"});
}
const ws_course_get_modules_with_completion_loads = 1;



/*
 * Course Restore
 */


// TODO: Test


type WS_Course_Restore_Message  = { wsfunction: "core_course_restore_course_x", courseid: number, course: Partial<WS_Course_2>&Pick<WS_Course_2, "categoryid">, options?: [WS_Course_Restore_Option] };
type WS_Course_Restore_Response = Partial<WS_Course_2>;  // TODO: Shouldn't be partial

type WS_Course_Restore_Option =
    //   { name: "blocks",             value: 0|1 }
    // | { name: "filters",            value: 0|1 }
    // | { name: "calendar_events_x",  value: 0|1 }
    // | { name: "groups_x",           value: 0|1 }
    // | { name: "competencies_x",     value: 0|1 }

    // | { name: "activities",         value: 0|1 }

    { name: "users",              value: 0|1 }    // default 0
    // | { name: "enrolments",         value: 0|1|2 }  // default 1 (different meaning),  web page may have indep select field or dep tick box with inverted meaning
    // | { name: "role_assignments",   value: 0|1 }    // default 0
    // | { name: "comments",           value: 0|1 }    // default 0
    // | { name: "userscompletion",    value: 0|1 }    // default 0
    // | { name: "logs",               value: 0|1 }    // default 0

    // | { name: "grade_histories",    value: 0|1 }    // default 0
    // | { name: "badges_x",           value: 0|1 }    // default 0 ?
;

async function ws_course_restore(message: WS_Course_Restore_Message): Promise<WS_Course_Restore_Response> {

    const options = { users: 0 };
    for (const option of message.options || []) {
        switch (option.name) {
        case "users":
            options.users = option.value;
            break;
        default:
            never_call(option.name);
        }
    }


    const target_category: WS_Course_Category_2 = await ws_call({wsfunction: "core_course_get_category_x", categoryid: message.course.categoryid});

    await ws_call({wsfunction: "core_course_view_course", courseid: message.courseid, sectionnumber: 0});

    const source_context_match = ws_page_details.body_class.match(/(?:^|\s)context-(\d+)(?:\s|$)/)
                                                                                || throwf(new Error("WS course restore, source context not found."));
    const source_context = parseInt(source_context_match[1]);

    await ws_load_content(
        "/backup/restorefile.php", {contextid: source_context},
        "page-backup-restorefile", {course: message.courseid},
    );

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main table.backup-files-table.generaltable  tbody tr  td.cell.c4.lastcol a[href*='&component=backup&filearea=course&']",
        action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid});
    let state_str = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main div.backup-restore form input[name='stage']", attribute: "value"});
    if (state_str == "2") { /*OK*/ } else                                       { throw new Error("WS course_restore, step 1 state unexpected."); }

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main div.backup-restore form [type='submit']", action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid});
    state_str = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main div.backup-restore form input[name='stage']", attribute: "value"});
    if (state_str == "4") { /*OK*/ } else                                       { throw new Error("WS course_restore, step 2 state unexpected."); }

    await ws_call_content({id_act: "* set_element_attribute",
        selector: "#region-main div.backup-course-selector.backup-restore form.mform input[name='catsearch'][type='text']",
        attribute: "value",  value: target_category.name});

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main div.backup-course-selector.backup-restore form.mform input[name='searchcourses'][type='submit']", action: "click"});

    await ws_loaded_content("", {});  // TODO: Add details

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main div.backup-course-selector.backup-restore form.mform input[name='targetid'][type='radio'][value='" + target_category.id + "']",
        action: "click"});

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main div.backup-course-selector.backup-restore form.mform input[value='Continue']", action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid});
    state_str = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main form#mform1.mform input[name='stage']", attribute: "value"});
    if (state_str == "4") { /*OK*/ } else                                       { throw new Error("WS course_restore, step 3 state unexpected."); }

    await ws_call_content({id_act: "* set_element_attribute",
        selector: "#region-main form#mform1.mform fieldset#id_rootsettings input[name='setting_root_users'][type='checkbox']",
        attribute: "checked",  value: options.users ? "checked" : ""});  // TODO: Check

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main form#mform1.mform fieldset#id_rootsettings input[name='setting_root_users'][type='checkbox']",
        action: "change"});  // TODO: Check

    await sleep(100);

    // if (!options.users) {  // TODO: Change to options.users != (users checked)?
    //    await ws_call_content({wsfunction: "x_page_edit_element",
    //        selector: "#region-main form#mform1.mform fieldset#id_rootsettings input[name='setting_root_users'][type='checkbox']",
    //        action: "click"});
    // }

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main form#mform1.mform input[name='submitbutton'][type='submit']", action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid});
    state_str = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main form#mform2.mform input[name='stage']", attribute: "value"});
    if (state_str == "8") { /*OK*/ } else                                       { throw new Error("WS course_restore, step 4 state unexpected."); }

    if (message.course.fullname) {
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings input[name^='setting_course_course_fullname'][type='text']",
            attribute: "value",  value: message.course.fullname});
    }

    if (message.course.shortname) {
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings input[name^='setting_course_course_shortname'][type='text']",
            attribute: "value",  value: message.course.shortname});
    }

    if (message.course.startdate) {
        const startdate = new Date(message.course.startdate * 1000);
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings select[name^='setting_course_course_startdate'][name$='[day]']",
            attribute: "value",  value: "1"});  // Set the day low initially, to avoid overflow when changing the year or month.
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings select[name^='setting_course_course_startdate'][name$='[year]']",
            attribute: "value",  value: "" + startdate.getUTCFullYear()});
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings select[name^='setting_course_course_startdate'][name$='[month]']",
            attribute: "value",  value: "" + (startdate.getUTCMonth() + 1)}); // TODO: Check
        await ws_call_content({id_act: "* set_element_attribute",
            selector: "#region-main form#mform2.mform fieldset#id_coursesettings select[name^='setting_course_course_startdate'][name$='[day]']",
            attribute: "value",  value: "" + startdate.getUTCDay()});
    }

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main form#mform2.mform input[name='submitbutton'][type='submit']", action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid});
    state_str = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main form#mform2.mform input[name='stage']", attribute: "value"});
    if (state_str == "16") { /*OK*/ } else                                      { throw new Error("WS course restore, step 5 state unexpected."); }

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main form#mform2.mform input[name='submitbutton'][type='submit']", action: "click"});

    await ws_loaded_content("page-backup-restore", {course: message.courseid}, 5);

    const course_new_id_str: string|null = await ws_call_content({id_act: "* get_element_attribute",
        selector: "#region-main form input[name='id'][type='hidden']", attribute: "value"});
    if (course_new_id_str && course_new_id_str.match(/^(\d+)$/)) { /*OK*/ }
    else                                                                        { throw new Error("WS course restore, ID not number."); }
    const course_new: Partial<WS_Course_2>&Pick<WS_Course_2, "id"> = { id: parseInt(course_new_id_str) };
    Object.assign(course_new, message.course);

    await ws_call_content({id_act: "* edit_element",
        selector: "#region-main form [type='submit']", action: "click"});

    await ws_loaded_content("page-course-view-"/*[a-z]**/, {course: course_new.id});

    return course_new;  // TODO: return full info?
}
const ws_course_restore_loads = 15;


/*
 * Courses Update
 */


type WS_Courses_Update_Message  = { wsfunction: "core_course_update_courses", courses: Array<Partial<WS_Course_3>&Pick<WS_Course_3, "id">> };
type WS_Courses_Update_Response = void;


async function ws_courses_update(message: WS_Courses_Update_Message):
                                              Promise<WS_Courses_Update_Response> {

    for (const course of message.courses) {

        // Load course edit page
        await ws_load_content("/course/edit.php", {id: course.id},
                                "page-course-edit", {course: course.id},
        );

        // Edit course
        await ws_call_content({id_act: "page-course-edit set", course: course});
        await ws_loaded_content("page-", {});

    }

}
function ws_courses_update_loads(num_courses: number) { return num_courses * 2; }


/*
 * Course View
 */


type WS_Course_View_Message  = { wsfunction: "core_course_view_course", courseid: number, sectionnumber?: number };
type WS_Course_View_Response = { status: boolean };


async function ws_course_view(message: WS_Course_View_Message): Promise<WS_Course_View_Response> {
    const courseid      = message.courseid;
    const sectionnumber = message.sectionnumber;

    // Open correct page
    ws_page_details         = await ws_call_content({id_act: "* get_details"});
    const section_match     = ws_page_details.location_search.match(/(?:^\?|&)section=(\d+)(?:&|$)/);
    if (   ws_load_match("page-course-view-"/*[a-z]+*/, {course: courseid})  // TODO:  Check for single activity course
        && ((sectionnumber != undefined) ? section_match && parseInt(section_match[1]) == sectionnumber : !section_match || parseInt(section_match[1]) == 0)
       ) { /*OK*/ ws_load_count(); }
    else {
        await ws_load_content("/course/view.php", {id: courseid, section: (sectionnumber ? sectionnumber : 0)},
                                "page-", {course: courseid},
        );
    }

    // Turn editing on (easiest to turn it on and leave it on, rather than turning it on and off)
    if (ws_page_details.body_class.match(/(?:^|\s)editing(?:\s|$)/)) { /*OK*/ }
    else {
        await ws_load_content("/course/view.php", {id: courseid, section: (sectionnumber ? sectionnumber : 0), sesskey: ws_sesskey, edit: "on"},
                                "page-", {course: courseid}, 0,
        );
    }

    // TODO: Repeat turn editing on if necessary?
    if (ws_page_details.body_class.match(/(?:^|\s)editing(?:\s|$)/)) { /*OK*/ }
    else                                                                        { throw new Error("WS course view, editing not on."); }
    // TODO: Check section number?
    // TODO: Figure out why editing off at this point sometimes.

    return {status: true};
}
const ws_course_view_loads = 1;


/*
 * Course: Get Enrolled Users
 */


type WS_Course_Get_Enrolled_Users_Message  = {wsfunction: "core_enrol_get_enrolled_users", courseid: number, options?: WS_Course_Get_Enrolled_Users_Option[]};
type WS_Course_Get_Enrolled_Users_Response = WS_User_W_Roles[];

// TODO: Rewrite for compatiblity with other versions of Moodle, if possible
// Note: Not well checked or tested.  Use with caution.

type WS_Course_Get_Enrolled_Users_Option =
      {name: "groupid",       value: number}
    | {name: "limitnumber",   value: number}
    | {name: "sortby",        value: "id" | "firstname" | "lastname" | "siteorder"}
    | {name: "sortdirection", value: "ASC" | "DESC"};
    // withcapability, onlyactive, userfields, limitfrom

async function ws_course_get_enrolled_users(message: WS_Course_Get_Enrolled_Users_Message):
                                                 Promise<WS_Course_Get_Enrolled_Users_Response> {
    const courseid                              = message.courseid;
    const options:  WS_Course_Get_Enrolled_Users_Option[]  = message.options || [];

    const pathname: string = "/enrol/users.php";
    const search: { id:             number,
                    sesskey:        string,
                    page:           number,
                    filtergroup?:   number,
                    perpage?:       number,
                    sort?:          string,
                    dir?:           string} = { id: courseid,  // "/user/index.php?id=" + courseid
                                                sesskey: ws_sesskey,
                                                page: 0};
    for (const an_option of options) {
        switch (an_option.name) {
        case "groupid":
            search.filtergroup  = an_option.value;
            break;
        case "limitnumber":
            search.perpage      = an_option.value;
            break;
        case "sortby":
            search.sort         = an_option.value;
            break;
        case "sortdirection":
            search.dir          = an_option.value;
            break;
        default:
            never_call(an_option);
        }
    }
    await ws_load_content(pathname, search,
                            "page-", {});
    return await ws_call_content({id_act: "page-enrol-users get"});
}



/*
 * Course: Get Assignments
 */

// TODO: Find more than 10 Turnitin 2 assignments.

type WS_Course_Get_Assigns_Message  = { wsfunction: "mod_assign_get_assignments", courseids?: number[],
                                                // capabilities?: Array<string>, includenotenrolledcourses?: 0|1,
                                                modname_x?: "assign"|"turnitintool"|"turnitintooltwo" };
type WS_Course_Get_Assigns_Response = { courses: WS_Course_1_W_Assigns[] };

type WS_Course_1_W_Assigns = WS_Course_1 & {
    // Variables
    assignments:    WS_Mod_Assign[],

    // Methods
    // mod_assign_get_assignments
};


async function ws_course_get_assigns(message: WS_Course_Get_Assigns_Message):
                                              Promise<WS_Course_Get_Assigns_Response> {
    const courseids = message.courseids                                         || throwf(new Error("WS course get assigns, no courses specified."));
    // TODO: Find my courses if none listed.
    //       check includenotenrolledcourses
    // const capabilities = message.capabilities || [];
    // const includenotenrolledcourses = message.includenotenrolledcourses || 0;
    const modname   = message.modname_x || "assign";

    const response: {courses: WS_Course_1_W_Assigns[]} = {courses: []};

    for (const course_id of courseids) {

        await ws_load_content("/mod/" + modname + "/index.php", {id: course_id},
                                "page-mod-" + modname /*--?index*/, {course: course_id}, 1, "There are no Assignments"
        ); // TODO: Handle error

        const course: WS_Course_1_W_Assigns = (await ws_call_content({id_act: "page-mod-assign-index get"})).course;

        response.courses.push(course);
    }
    return response;
}
function ws_course_get_assigns_loads(num_courses: number) { return num_courses; }



/*
 * Course Category
 */


type WS_Course_Category_0 = WS_Object & {
    // Key
    readonly id:        number;

    // Methods
    // core_course_delete_categories arguments
};



type WS_Course_Category_1 = WS_Course_Category_0 & {
    // Variable
    name:               string;     // No default
    description:        string;     // should be in Course Category 2?

    // Methods
    // core_course_create_categories response
};


type WS_Course_Category_2 = WS_Course_Category_1 & {
    idnumber?:          string;
    // description
    description_format: 0|1|2|4;    // Default to 1, Don't retain if description changed
    parent:             number;     // Default to 0
    // theme?:          string;

    // Methods
    // core_course_create_categories argument categories partial +no_default -key
    // core_course_update_categories argument categories partial +key
};


// WS_Course_Category_3
    // Variables
    // sortorder:       number;
    // visible?:        0|1;
    // visibleold?:     0|1;

    // Calculated
    // coursecount:     number;
    // timemodified?:   number;
    // depth:           number;
    // path:            string;

    // Methods
    // core_course_get_categories response


/*
 * Course Category: Get
 */


// TODO: Test


type WS_Course_Category_Get_Message  = { wsfunction: "core_course_get_category_x", categoryid: number };
type WS_Course_Category_Get_Response = WS_Course_Category_2;


async function ws_course_category_get(message: WS_Course_Category_Get_Message):
                                              Promise<WS_Course_Category_Get_Response> {
    const category_id = message.categoryid;

    // Load category edit page
    await ws_load_content("/course/editcategory.php", {id: category_id},
                            "page-course-editcategory", {},
    );

    // Return course details
    return await ws_call_content({id_act: "page-course-editcategory get"});

}
const ws_course_category_get_loads = 1;






/*
 * Course Category: Get Displayed
 */


// TODO: Test


type WS_Course_Category_Get_Displayed_Message  = { wsfunction: "core_course_get_category_displayed_x" };
type WS_Course_Category_Get_Displayed_Response = WS_Course_Category_1;


async function ws_course_category_get_displayed(_message: WS_Course_Category_Get_Displayed_Message): Promise<WS_Course_Category_Get_Displayed_Response> {

    // Check page
    await ws_loaded_content("page-course-index-category", {}, 0);

    // Return course details
    return await ws_call_content({id_act: "page-course-index-category get_category"});

}
const ws_course_category_get_displayed_loads = 0;




/*
 * Course Category: Get Courses Displayed
 */


type WS_Course_Category_Get_Displayed_Courses_Message  = { wsfunction: "core_course_get_courses_displayed_x" };
type WS_Course_Category_Get_Displayed_Courses_Response = WS_Course_1[];


async function ws_course_category_get_displayed_courses(_message: WS_Course_Category_Get_Displayed_Courses_Message):
                                                       Promise<WS_Course_Category_Get_Displayed_Courses_Response> {
    return await ws_call_content({id_act: "page-course-index-category get_courses"});
}
const ws_course_category_get_displayed_courses_loads = 0;




/*
 * Course Section
 */



type WS_Course_Section_0 = WS_Object & {
    // Key
    readonly id:    number,
};


type WS_Course_Section_1 = WS_Course_Section_0 & {
    // Variables
    name:           string,
    visible?:       0|1,
    summary:        string,
    // summaryformat: 0|1|2|4,
    section?:       number,
    // hiddenbynumsections
    // uservisible
    // availabilityinfo

    level_x?:       number,
};


type WS_Course_Section_W_Modules = WS_Course_Section_1 & {
    // Variables
    modules:        WS_Module_1[],

    // Methods
    // core_course_get_contents
};



/*
 * Course Section: Add
 */


// TODO: Test


type WS_Course_Section_Add_Message  = { wsfunction: "core_course_add_section_x", courseid: number };
type WS_Course_Section_Add_Response = void;


async function ws_course_section_add(message: WS_Course_Section_Add_Message): Promise<WS_Course_Section_Add_Response> {
    await ws_load_content(  // TODO: Fix for flexsections?
        "/course/changenumsections.php", {courseid: message.courseid, increase: 1, sesskey: ws_sesskey},
        "page-course-view-", {course: message.courseid},
    );
}
const ws_course_section_add_loads = 1;


/*
 * Course Section: Delete
 */


type WS_Course_Section_Delete_Message  = { wsfunction: "core_course_delete_section_x", sectionid: number };
type WS_Course_Section_Delete_Response = void;


async function ws_course_section_delete(message: WS_Course_Section_Delete_Message): Promise<WS_Course_Section_Delete_Response> {
    await ws_load_content(  // TODO: Fix for flexsections?
        "/course/editsection.php", {id: message.sectionid, confirm: 1, delete: 1, sesskey: ws_sesskey},
        "page-course-view-"/*[a-z]+*/, {},
    );
}
const ws_course_section_delete_loads = 1;



/*
 * Course Section: Edit by Num
 */


// TODO: Test


type WS_Course_Section_Edit_By_Num_Message  = { wsfunction: "core_course_edit_section_by_num_x", action: "hide"|"show"|"move_x", value_x?: number
                                                       courseid: number, sectionnum: number, sectionreturn?: number };
type WS_Course_Section_Edit_By_Num_Response = void;


async function ws_course_section_edit_by_num(message: WS_Course_Section_Edit_By_Num_Message): Promise<WS_Course_Section_Edit_By_Num_Response> {
    const courseid      = message.courseid;
    const sectionnum    = message.sectionnum;
    const sectionreturn = message.sectionreturn;

    switch (message.action) {
    case "hide":
        await ws_load_content("/course/view.php", {id: courseid, section: sectionreturn, sesskey: ws_sesskey, hide: sectionnum},
            "page-course-view-"/*[a-z]+*/, {course: courseid},
        );
        break;
    case "show":
        await ws_load_content("/course/view.php", {id: courseid, section: sectionreturn, sesskey: ws_sesskey, show: sectionnum},
            "page-course-view-"/*[a-z]+*/, {course: courseid},
        );
        break;
    case "move_x":  // TODO: Test
        await ws_load_content(
            "/course/view.php", {id: courseid, section: sectionnum, sesskey: ws_sesskey, move: message.value_x
                                                                                || throwf(new Error("WS course section edit, no amount specified."))},
            "page-course-view-"/*[a-z]+*/, {course: courseid},
        );
        break;
    default:
        never_call(message.action);
    }

}
const ws_course_section_edit_by_num_loads = 1;




/*
 * Course Section: Get
 */


// TODO: check


type WS_Course_Section_Get_Message  = { wsfunction: "core_course_get_section_x", sectionid: number };
type WS_Course_Section_Get_Response = WS_Course_Section_1;


async function ws_course_section_get(message: WS_Course_Section_Get_Message): Promise<WS_Course_Section_Get_Response> {
    const section_id = message.sectionid;

    // Load section edit page
    ws_page_details = await ws_call_content({id_act: "* get_details"});
    const id_match  = ws_page_details.location_search.match(/(?:^\?|&)id=(\d+)(?:&|$)/);
    if (   ws_load_match("page-course-editsection", {})
        && id_match && parseInt(id_match[1]) == section_id) { /*OK*/ ws_load_count(); }
    else {
        await ws_load_content("/course/editsection.php", {id: section_id, sr: 0 /* TODO: Remove this? */},
                                "page-course-editsection", {},
        );
    }

    // Return page content
    return await ws_call_content({id_act: "page-course-editsection get"});

}
const ws_course_section_get_loads = 1;





/*
 * Course Section: Update
 */


// TODO: Check



type WS_Course_Section_Update_Message  = { wsfunction: "core_course_update_section_x", section: Partial<WS_Course_Section_1>&Pick<WS_Course_Section_1, "id">};
type WS_Course_Section_Update_Response = void;


async function ws_course_section_update(message: WS_Course_Section_Update_Message): Promise<WS_Course_Section_Update_Response> {

    // Open section edit page
    await ws_call({wsfunction: "core_course_get_section_x", sectionid: message.section.id});

    // Edit
    await ws_call_content({id_act: "page-course-editsection set", section: message.section});
    await ws_loaded_content("page-course-view-"/*[a-z]+*/, {});

}
const ws_course_section_update_loads = 2;




/*
 * Module
 */


type WS_Module_0 = WS_Object & {
    // Key
    readonly id:        number,
};


type WS_Module_1 = WS_Module_0 & {
    // Key
    readonly instance?: number,

    // Constant
    readonly modname:   string,

    // Variable
    name:               string,
    // indent?:         number,
    // visible?:        number,
    // visibleoncoursepage?: number,
    // availibility?:   string,

    // Course Module 1a Variables
    description?:       string,

    // Course Module 1a Methods
    // core_course_get_contents +others
};

type WS_Module_2 = WS_Module_1 & {
    // Key
    readonly instance:  number,

    // Constant
    readonly course:    number,

    // Variables
    completion:         0|1|2,      // 0 = none, 1 = manual, 2 = conditions
    // showdescription?: 0|1

    // Calculated
    sectionnum:         number,

    // Methods
    // core_course_get_course_module
    // core_course_get_course_module_by_instance

    // Extra Variables
    assignsubmission_file_enabled_x?:       0|1,
    assignsubmission_onlinetext_enabled_x?: 0|1,
    completionview_x?:                      0|1,
    completionusegrade_x?:                  0|1,
    completionsubmit_x?:                    0|1,
};




/*
 * Module Activity
 */


type WS_Mod_Activity_1 = WS_Object & {
    // Constant
    readonly course:    number,

    // Variables
    name:               string,
};


/*
 * Module Assignment
 */


type WS_Mod_Assign = WS_Mod_Activity_1 & {
    // Key
    readonly cmid:  number,  // Called "coursemodule" on other activity types?

    // Methods
    // mod_assign_get_assignments
};






/*
 * Module: Create
 */


// TODO: Test


type WS_Module_Create_Message  = { wsfunction: "core_course_create_module_x", cm: Partial<WS_Module_2>&Pick<WS_Module_2, "course"|"modname"|"sectionnum">};
type WS_Module_Create_Response = WS_Module_1;  // TODO: should be 2?


async function ws_module_create(message: WS_Module_Create_Message): Promise<WS_Module_Create_Response> {
    if (!message.cm.id) { /*OK*/ } else                                         { throw new Error("WS course create module, parameter module ID given."); }

    await ws_load_content("/course/mod.php", {id: message.cm.course, sesskey: ws_sesskey, sr: 0 /* TODO: remove? */, add: message.cm.modname, section: message.cm.sectionnum},
                            "page-mod-" + message.cm.modname + "-mod", {course: message.cm.course},
    );

    // Make the changes
    await ws_call_content({id_act: "page-mod-*-mod set", cm: message.cm});
    await ws_loaded_content("page-", {course: message.cm.course});

    // Find module with highest ID num
    const sections: WS_Course_Section_W_Modules[] = await ws_call_content({id_act: "page-course-view-* get_contents",
                                                                        options: [{name: "sectionnumber", value: message.cm.sectionnum}]});
    let newest_mod: WS_Module_1|null = null;
    for (const section of sections) {
        for (const module of section.modules) {
            if (!newest_mod || module.id > newest_mod.id) {
                newest_mod = module;
            }
        }
    }
    if (newest_mod && newest_mod.modname == message.cm.modname) { /*OK*/ } else { throw new Error("WS course create module, couldn't find new module."); }
    // TODO: Better checking?

    return newest_mod;

}
const ws_module_create_loads = 2;


/*
 * Module: Edit
 */


// TODO: Test


type WS_Module_Edit_Message  = { wsfunction: "core_course_edit_module", id: number, action: "moveto_x"|"movetosection_x",
                                                value_x?: number, sectionreturn?: number };
type WS_Module_Edit_Response = void;


async function ws_module_edit(message: WS_Module_Edit_Message): Promise<WS_Module_Edit_Response> {

    await ws_load_content("/course/mod.php", {sesskey: ws_sesskey, sr: message.sectionreturn, copy: message.id},
                            "page-course-view-", {},
    );

    switch (message.action) {
    case "moveto_x":
        await ws_load_content("/course/mod.php", {moveto: message.value_x, sesskey: ws_sesskey},
                            "page-course-view-", {},
        );
        break;
    case "movetosection_x":
        await ws_load_content("/course/mod.php", {movetosection: message.value_x, sesskey: ws_sesskey},
                            "page-course-view-", {},
        );
        break;
    default:
        never_call(message.action);
    }

}
const ws_module_edit_loads = 2;






/*
 * Module: Get
 */


type WS_Module_Get_Message  = { wsfunction: "core_course_get_course_module", cmid: number };
type WS_Module_Get_Response = { cm: WS_Module_2 };


async function ws_module_get(message: WS_Module_Get_Message): Promise<WS_Module_Get_Response> {

    // Load module edit page, if necessary (assumes no uncommitted edits)
    ws_page_details  = await ws_call_content({id_act: "* get_details"});
    if (ws_load_match("page-mod-"/*[a-z]+-mod*/, {cmid: message.cmid})) { /*OK*/ ws_load_count(); }
    else {
        await ws_load_content("/course/mod.php", {update: message.cmid, sesskey: ws_sesskey, sr: 0 /* TODO: Remove this? */},
                                "page-mod-"/*[a-z]+-mod*/, {cmid: message.cmid},
        );
    }

    // Return module content
    return await ws_call_content({id_act: "page-mod-*-mod get"});

}
const ws_module_get_loads = 1;



/*
 * Module: Update
 */


type WS_Module_Update_Message  = { wsfunction: "core_course_update_course_module_x", cm: Partial<WS_Module_2>&Pick<WS_Module_2, "id">};
type WS_Module_Update_Response = void;


async function ws_module_update(message: WS_Module_Update_Message): Promise<WS_Module_Update_Response> {

    if (message.cm.id) {/*OK*/} else                                            { throw new Error("WS module update, id missing."); }

    // Load the course module edit page
    await ws_call({wsfunction: "core_course_get_course_module", cmid: message.cm.id});

    // Make the changes
    try {
        await ws_call_content({id_act: "page-mod-*-mod set", cm: message.cm});
        await ws_loaded_content("page-", {});
    } catch (err) {
        if (err.message == "WSC course update module, unlock needed.") { /*OK*/ }
        else                                                                    { throw err; }
        await ws_loaded_content("page-", {}, 0.5);
        await ws_call_content({id_act: "page-mod-*-mod set", cm: message.cm});
        await ws_loaded_content("page-", {}, 0.5);
    }

}
const ws_module_update_loads = 2;




/*
 * Module Feedback: Use Template
 */


// TODO: Test


type WS_Mod_Feedback_Use_Template_Message  = { wsfunction: "mod_feedback_use_template_x", cmid: number, feedback_template_id: number};
type WS_Mod_Feedback_Use_Template_Response = void;


async function ws_mod_feedback_use_template(message: WS_Mod_Feedback_Use_Template_Message): Promise<WS_Mod_Feedback_Use_Template_Response> {

    await ws_load_content("/mod/feedback/edit.php", {id: message.cmid, do_show: "templates"},
                            "page-mod-feedback-edit", {cmid: message.cmid}
    );

    await ws_call_content({id_act: "* set_element_attribute", selector: ":root #region-main form#mform2.mform select#id_templateid",
                            attribute: "value", value: "" + message.feedback_template_id});  // TODO: fix;

    await ws_call_content({id_act: "* edit_element", selector: ":root #region-main form#mform2.mform select#id_templateid", action: "change" });

    await ws_loaded_content("page-mod-feedback-use_templ", {});

    //   ":root #region-main form#mform1.mform input#id_deleteolditems_1"  (don't bother?)
    // or ":root #region-main form#mform1.mform input#id_deleteolditems_0"  click   ???

    await ws_call_content({id_act: "* edit_element", selector: ":root #region-main form#mform1.mform input#id_submitbutton", action: "click" });

    await ws_loaded_content("page-mod-feedback-edit", {});

}
const ws_mod_feedback_use_template_loads = 3;




/*
 * User
 */


type WS_User = WS_Object & {
    // User 0 Key
    readonly id:            number;

    // User 1 Calculated
    readonly fullname:      string;

    // User 3 Variables
    email?:                 string;

    // User 4 Calculated
    readonly lastaccess?:   number
};


type WS_User_W_Roles = WS_User & {   // enrolled user?
    // Variables
    roles?:                 WS_Role[],

    // Methods
    // core_enrol_get_enrolled_users
};


type WS_Role = WS_Object & {
    // Key
    readonly roleid:    number;

    // Variables
    name:               string;

    // Methods
    // core_enrol_get_enrolled_users
};



/*
 * Test
 */

async function ws_test(token: string, courseid: number) {

    // Get Blocks
    const c_blocks_a    = await ws_call({wsfunction: "core_block_get_course_blocks",    courseid: courseid}) as {blocks: WS_Generic_Object[]};
    const c_blocks_a_f  = await ws_call_fetch({wstoken: token, moodlewsrestformat: "json", wsfunction: "core_block_get_course_blocks", courseid: courseid}) as {blocks: WS_Generic_Object[]};
    if (c_blocks_a.blocks.length == c_blocks_a_f.blocks.length) { /* OK */ } else   { throw new Error("get blocks a responses different lengths"); }
    for (let block_count = 0; block_count < c_blocks_a.blocks.length; block_count += 1) {
        for (const block_prop_name in c_blocks_a.blocks[block_count]) if (c_blocks_a.blocks[block_count].hasOwnProperty(block_prop_name) && !block_prop_name.endsWith("_x")) {
            if (c_blocks_a_f.blocks[block_count].hasOwnProperty(block_prop_name) && c_blocks_a.blocks[block_count][block_prop_name] == c_blocks_a_f.blocks[block_count][block_prop_name]) { /* OK */ }
            else                                                                { throw new Error("get blocks a responses " + block_count + " " + block_prop_name + " differs"); }
        }
    }

    // Create Block, Update Block, Delete Block

    // const c_content    = await ws_call({wsfunction: "core_course_get_contents",        courseid: courseid});
    // const c_course     = await ws_call({wsfunction: "core_course_get_course_x",        courseid: courseid});
    // const c_cm4        = await ws_call({wsfunction: "core_course_get_course_module",   cmid: x});
    // const c_mwc        = await ws_call({wsfunction: "core_course_get_modules_with_completion_x", courseid: courseid});
    // const c_sec1       = await ws_call({wsfunction: "core_course_get_section_x",       sectionid: c_content[1].id});
    // const c_mod_as     = await ws_call({wsfunction: "mod_assign_get_assignments",      courseids: [courseid]});


    // https://demo.moodle.net/webservice/rest/server.php?wstoken=...&moodlewsrestformat=json&wsfunction=core_course_get_contents&courseid=3&options[0][name]=sectionnumber&options[0][value]=1

    // const done = courses && c3_blocks && c3_content && c3_course && c3_cm4 && c3_cm5 && c3_cm6 && c3_cm7 && c3_cm8 && c3_mwc && c3_sec1 && c3_mod_as;

    return;

}




/*
 * Load Check
 */


if (window.location.protocol.match(/^[a-z]+-extension:$/)) { /* OK */ } else    { throw new Error("WS call init, execution context not recognised."); }
