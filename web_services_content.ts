/*
 * Moodle JS Content Script
 * Scrape Moodle web pages.
 */


function sleep(time: number): Promise<{}>  { return new Promise((resolve) => setTimeout(resolve, time)); }
function throwf(err: Error): never                                              { throw err; }
function never_call(_never_var: never): never /* Shouldn't ever happen */       { throw new Error("WSC never call, unexpected case."); }



/*
 * Init Routine
 */

function wsc_init(): {status: boolean} {
    browser.runtime.onMessage.addListener(wsc_on_call);
    return {status: true};
}



/*
 * Messaging
 */


// type WSC_Message_Abstract = { id_act: string };


type WSC_Message  = /* WSC_Message_Abstract & */ (

    // Generic Page
      WSC_Page_Ping_Message
    | WSC_Page_Get_Details_Message
    | WSC_Page_Get_Element_Attribute_Message
    | WSC_Page_Set_Element_Attribute_Message
    | WSC_Page_Edit_Element_Message

    // Block
    | WSC_Block_Edit_Set_Message

    // Course
    | WSC_Course_View_Get_Blocks_Message  // Page?
    | WSC_Course_View_Get_Contents_Message
    | WSC_Course_Edit_Get_Message
    | WSC_Course_Completion_Get_Message
    | WSC_Course_Edit_Set_Message
    | WSC_Course_Enrolled_Users_Get_Message
    | WSC_Course_Assigns_Get_Message

    // Course Category
    | WSC_Course_Category_Edit_Get_Message
    | WSC_Course_Category_Index_Get_Message
    | WSC_Course_Category_Index_Get_Courses_Message

    // Course Section
    | WSC_Course_Section_Edit_Get_Message
    | WSC_Course_Section_Edit_Set_Message

    // Module
    | WSC_Module_Edit_Get_Message
    | WSC_Module_Edit_Set_Message
);


type WSC_Response =

    // Generic Page
      WSC_Page_Ping_Response
    | WSC_Page_Get_Details_Response
    | WSC_Page_Get_Element_Attribute_Response
    | WSC_Page_Set_Element_Attribute_Response
    | WSC_Page_Edit_Element_Response

    // Block
    | WSC_Block_Edit_Set_Response

    // Course
    | WSC_Course_View_Get_Blocks_Response
    | WSC_Course_View_Get_Contents_Response
    | WSC_Course_Edit_Get_Response
    | WSC_Course_Completion_Get_Response
    | WSC_Course_Edit_Set_Response
    | WSC_Course_Enrolled_Users_Get_Response
    | WSC_Course_Assigns_Get_Response

    // Course Category
    | WSC_Course_Category_Edit_Get_Response
    | WSC_Course_Category_Index_Get_Response
    | WSC_Course_Category_Index_Get_Courses_Response

    // Course Section
    | WSC_Course_Section_Edit_Get_Response
    | WSC_Course_Section_Edit_Set_Response

    // Module
    | WSC_Module_Edit_Get_Response
    | WSC_Module_Edit_Set_Response
;


// Generic Page
async function wsc_on_call(message: WSC_Page_Ping_Message):                     Promise<WSC_Page_Ping_Response>;
async function wsc_on_call(message: WSC_Page_Get_Details_Message):              Promise<WSC_Page_Get_Details_Response>;
async function wsc_on_call(message: WSC_Page_Get_Element_Attribute_Message):    Promise<WSC_Page_Get_Element_Attribute_Response>;
async function wsc_on_call(message: WSC_Page_Set_Element_Attribute_Message):    Promise<WSC_Page_Set_Element_Attribute_Response>;
async function wsc_on_call(message: WSC_Page_Edit_Element_Message):             Promise<WSC_Page_Edit_Element_Response>;

// Block
async function wsc_on_call(message: WSC_Block_Edit_Set_Message):                Promise<void>;

// Course
async function wsc_on_call(message: WSC_Course_View_Get_Blocks_Message):        Promise<WSC_Course_View_Get_Blocks_Response>;
async function wsc_on_call(message: WSC_Course_View_Get_Contents_Message):      Promise<WSC_Course_View_Get_Contents_Response>;
async function wsc_on_call(message: WSC_Course_Edit_Get_Message):               Promise<WSC_Course_Edit_Get_Response>;
async function wsc_on_call(message: WSC_Course_Completion_Get_Message):         Promise<WSC_Course_Completion_Get_Response>;
async function wsc_on_call(message: WSC_Course_Edit_Set_Message):               Promise<WSC_Course_Edit_Set_Response>;
async function wsc_on_call(message: WSC_Course_Enrolled_Users_Get_Message):     Promise<WSC_Course_Enrolled_Users_Get_Response>;
async function wsc_on_call(message: WSC_Course_Assigns_Get_Message):            Promise<WSC_Course_Assigns_Get_Response>;

// Course Category
async function wsc_on_call(message: WSC_Course_Category_Edit_Get_Message):      Promise<WSC_Course_Category_Edit_Get_Response>;
async function wsc_on_call(message: WSC_Course_Category_Index_Get_Message):     Promise<WSC_Course_Category_Index_Get_Response>;
async function wsc_on_call(message: WSC_Course_Category_Index_Get_Courses_Message): Promise<WSC_Course_Category_Index_Get_Courses_Response>;

// Course Section
async function wsc_on_call(message: WSC_Course_Section_Edit_Get_Message):       Promise<WSC_Course_Section_Edit_Get_Response>;
async function wsc_on_call(message: WSC_Course_Section_Edit_Set_Message):       Promise<WSC_Course_Section_Edit_Set_Response>;

// Module
async function wsc_on_call(message: WSC_Module_Edit_Get_Message):               Promise<WSC_Module_Edit_Get_Response>;
async function wsc_on_call(message: WSC_Module_Edit_Set_Message):               Promise<WSC_Module_Edit_Set_Response>;


async function wsc_on_call(message: WSC_Message):                               Promise<WSC_Response> {
    switch (message.id_act) {

    // Generic Page
    case "* ping":                                      return wsc_page_ping(message);
    case "* get_details":                               return wsc_page_get_details(message);
    case "* get_element_attribute":                     return wsc_page_get_element_attribute(message);
    case "* set_element_attribute":                     return wsc_page_set_element_attribute(message);
    case "* edit_element":                              return wsc_page_edit_element(message);

    // Block
    case "page-course-view set_block":                  return await wsc_block_edit_set(message);

    // Course
    case "page-course-view-* get_blocks":               return wsc_course_view_get_blocks(message);
    case "page-course-view-* get_contents":             return wsc_course_view_get_contents(message);
    case "page-course-edit get":                        return wsc_course_edit_get(message);
    case "page-course-completion get":                  return wsc_course_completion_get(message);
    case "page-course-edit set":                        return await wsc_course_edit_set(message);
    case "page-enrol-users get":                        return wsc_course_enrolled_users_get(message);
    case "page-mod-assign-index get":                   return wsc_course_assigns_get(message);

    // Course Category
    case "page-course-editcategory get":                return wsc_course_category_edit_get(message);
    case "page-course-index-category get_category":     return wsc_course_category_index_get(message);
    case "page-course-index-category get_courses":      return wsc_course_category_index_get_courses(message);

    // Course Section
    case "page-course-editsection get":                 return wsc_course_section_edit_get(message);
    case "page-course-editsection set":                 return await wsc_course_section_edit_set(message);

    // Module
    case "page-mod-*-mod get":                          return wsc_module_edit_get(message);
    case "page-mod-*-mod set":                          return await wsc_module_edit_set(message);

    default:                                            return never_call(message);
    }
}


/*
 * Moodle page meta-data definitions (not actually used yet)
 */


type WSC_Page_Meta_Abstract = {
    type:       "number" | "string" | "object" | "array";
};

type WSC_Page_Meta_Value_Abstract = WSC_Page_Meta_Abstract & {
    type:       "number" | "string" | "object";
    closest?:   string;
    selector?:  string;
};

type WSC_Page_Meta_Primative = WSC_Page_Meta_Value_Abstract & {
    type:       "number" | "string";
    attribute:  string;
    value?:     string;
};

type WSC_Page_Meta_Object = WSC_Page_Meta_Value_Abstract & {
    type:       "object";
    properties: { [index: string]: WSC_Page_Meta }
};

type WSC_Page_Meta_Value = WSC_Page_Meta_Primative | WSC_Page_Meta_Object;

type WSC_Page_Meta_Array = WSC_Page_Meta_Abstract & {
    type:       "array";
    elements:    WSC_Page_Meta_Value;
};

type WSC_Page_Meta = WSC_Page_Meta_Value | WSC_Page_Meta_Array;



/*
 * Generic Page
 */


type WSC_Page_Ping_Message  = { id_act: "* ping" };
type WSC_Page_Ping_Response = boolean;


function wsc_page_ping(_message: WSC_Page_Ping_Message): WSC_Page_Ping_Response {
    return true;
}



type WS_Page_Details = {
    // href = origin + pathname + search + hash
    location_origin:    string,
    location_pathname:  string,
    location_search:    string, // section
    location_hash:      string,
    body_id:            string,
    body_class:         string, // format-* path-*+ lang-* * pagelayout-* course-* context-* category-*? editing? notloggedin? cmid-*?
    site_sesskey:       string,
    error_message?:     string,
};




type WSC_Page_Get_Details_Message  = { id_act: "* get_details", ignore_error?: string };
type WSC_Page_Get_Details_Response = WS_Page_Details;


function wsc_page_get_details(message: WSC_Page_Get_Details_Message): WSC_Page_Get_Details_Response {
    const error_message_html = window.document.querySelector(":root #region-main .errorbox .errormessage");
    if (error_message_html && error_message_html.textContent != message.ignore_error)
                                                                                { throw(new Error(error_message_html.textContent || "")); } // TODO: Test
    return {
        location_origin:    window.location.origin,
        location_pathname:  window.location.pathname,
        location_search:    window.location.search,
        location_hash:      window.location.hash,
        body_id:            window.document.body.getAttribute("id")             || throwf(new Error("WSC doc details get, body ID not found.")),
        body_class:         window.document.body.getAttribute("class")          || throwf(new Error("WSC doc details get, body class not found.")),
        site_sesskey:       (((window.document.querySelector(":root a.menu-action[data-title='logout,moodle']")
                                                                                || throwf(new Error("WSC doc details get, couldn't get logout menu item.")) // Caught
                              ) as HTMLAnchorElement
                             ).search.match(/^\?sesskey=(\w+)$/)                || throwf(new Error("WSC doc details get, session key not found."))
                            )[1],
        error_message:      error_message_html ? error_message_html.textContent || "" : undefined,
    };
}





type WSC_Page_Get_Element_Attribute_Message  = { id_act: "* get_element_attribute", selector: string, attribute: string, ignore_error?: boolean };
type WSC_Page_Get_Element_Attribute_Response = string|null;


function wsc_page_get_element_attribute(message: WSC_Page_Get_Element_Attribute_Message): WSC_Page_Get_Element_Attribute_Response {
    const element: Element|null = window.document.querySelector(message.selector);
    if (element) {
        return element.getAttribute(message.attribute);
    } else if (message.ignore_error) {
        return null;
    } else                                                                      { throw new Error("WSC doc get attribute, element not found"); }
}





type WSC_Page_Set_Element_Attribute_Message  = { id_act: "* set_element_attribute", selector: string, attribute: string, value: string, ignore_error?: boolean };
type WSC_Page_Set_Element_Attribute_Response = void;


function wsc_page_set_element_attribute(message: WSC_Page_Set_Element_Attribute_Message): WSC_Page_Set_Element_Attribute_Response {
    const element: Element|null = window.document.querySelector(message.selector);
    if (element) {
        if (message.attribute == "value") {
            if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) { /*OK*/ }
            else                                                                { throw new Error("WSC doc set attribute, element type unexpected."); }
            element.value = message.value;
        } else if (message.attribute == "checked") {
            if (element instanceof HTMLInputElement) { /*OK*/ } else            { throw new Error("WSC doc set attribute, element type unexpected."); }
            if (message.value == "checked" || message.value == "") { /*OK*/ }
            else                                                                { throw new Error("WSC doc set attribute, value unexpected."); }
            element.checked = message.value ? true : false;
        } else {
            element.setAttribute(message.attribute, message.value);
        }
    } else if (message.ignore_error) {
        /* OK */
    } else                                                                      { throw new Error("WSC doc set attribute, element not found."); }
}





type WSC_Page_Edit_Element_Message  = { id_act: "* edit_element", selector: string, action: "change"|"click"|"submit", ignore_error?: boolean };
type WSC_Page_Edit_Element_Response = void;


function wsc_page_edit_element(message: WSC_Page_Edit_Element_Message): WSC_Page_Edit_Element_Response {
    const element: Element|null = window.document.querySelector(message.selector);
    if (element) {
        switch (message.action) {
        case "change":
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
                element.dispatchEvent(new Event("change"));
            } else if (message.ignore_error) { /*OK*/ } else                    { throw new Error("WSC doc edit, change element type unexpected."); }
            break;
        case "click":
            if (   element instanceof HTMLAnchorElement
                || element instanceof HTMLButtonElement
                || element instanceof HTMLInputElement && (element.type == "radio" || element.type == "button" || element.type == "submit" )) {
                element.click();
            } else if (message.ignore_error) { /*OK*/ } else                    { throw new Error("WSC doc edit, click element type unexpected."); }
            break;
        case "submit":
            if (element instanceof HTMLFormElement) {
                element.submit();
            } else if (message.ignore_error) { /*OK*/ } else                    { throw new Error("WSC doc edit, submit element type unexpected."); }
            break;
        default:
            never_call(message.action);
        }
    } else if (message.ignore_error) {
        /*OK*/
    } else                                                                      { throw new Error("WSC doc edit, element not found"); }
}



/*
 * Block: Edit Page
 */


const wsc_block_edit_meta: WSC_Page_Meta_Object =
                            { type: "object",   selector: "body",                                                                       properties: {
    block:                  { type: "object",   selector: "form#mform1",                        attribute: "value",                     properties: {
        courseid:           { type: "number",   selector: "[name='id']",                        attribute: "value"                      },
        instanceid:         { type: "number",   selector: "[name='bui_editid']",                attribute: "value"                      },
        region:             { type: "string",   selector: "[name='bui_region']",                attribute: "value"                      },
        defaultregion_x:    { type: "string",   selector: "[name='bui_defaultregion']",         attribute: "value"                      },
        visible_x:          { type: "number",   selector: "[name='bui_visible']",               attribute: "value"                      },
        weight_x:           { type: "number",   selector: "[name='bui_weight']",                attribute: "value"                      },
        title_x:            { type: "string",   selector: "[name='config_title']",              attribute: "value"                      },  // maybe exists ???
        activitiesincluded_x: { type: "string", selector: "[name='config_activitiesincluded']", attribute: "value"                      }   // maybe exists ???
    }}
}};


type WSC_Block_Edit_Set_Message = { id_act: "page-course-view set_block", block: Partial<WS_Block_1x> };
type WSC_Block_Edit_Set_Response = void;


async function wsc_block_edit_set(message: WSC_Block_Edit_Set_Message): Promise<WSC_Block_Edit_Set_Response> {

    const block = message.block;
    const block_html:   HTMLFormElement     = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC block update, form not found."))
                                              ) as HTMLFormElement;

    for (const block_key in block) if (block.hasOwnProperty(block_key)) {

        let block_key_html: string|null;
        switch (block_key) {
            case "courseid_x":  // id?
            case "instanceid":  // bui_editid?
            case "name":        // _qf__block_*_edit_form?
                block_key_html = null;
                break;
            case "region":
                block_key_html = "bui_" + block_key;
                break;
            case "defaultregion_x":
            case "defaultweight_x":
            case "visible_x":
            case "weight_x":
                block_key_html = "bui_" + block_key.split("_")[0];
                break;
            case "title_x":                 // HTML block
            case "activitiesincluded_x":    // Progress Completion block
                block_key_html = "config_" + block_key.split("_")[0];
                break;
            default:                                                            { throw new Error("WSC block update, property unrecognised: " + block_key); }
        }

        if (block_key_html) {
            const block_value = block[block_key];
            if (block_value != undefined) { /*OK*/ } else                       { throw new Error("WSC block update, value undefined: " + block_key); }
            const block_property_html: Element|HTMLCollection = block_html.elements.namedItem(block_key_html)
                                                                                || throwf(new Error("WSC block update, field not found: " + block_key));
            if (   block_property_html instanceof HTMLInputElement  && (block_property_html.type == "text" || block_property_html.type == "hidden")
                || block_property_html instanceof HTMLSelectElement &&  block_property_html.type == "select-one"                                   ) {
                block_property_html.value = "" + block_value;
            } else                                                              { throw new Error("WSC block update, field type unrecognised: " + block_key); }
            // TODO: Trigger change?
            await sleep(100);
        }

    }
    block_html.submit();
}




/*
 * Course: View Page
 */

const wsc_course_view_blocks_meta: WSC_Page_Meta_Object =
                            { type: "object",   selector: "body",                                                                       properties: {
    blocks:                 { type: "array",                                                                                            elements:
                            { type: "object",   selector: ".block",                                                                     properties: {
            name:           { type: "string",                                   attribute: "data-block"                                 },
            instanceid:     { type: "number",                                   attribute: "id",            value: "inst"               },
            region:         { type: "string",   closest:  ".block-region",      attribute: "data-blockregion"                           },  // closest ???
            visible_x:      { type: "number",                                   attribute: "class",         value: "invisible"          },  // value in list ???
            title_x:        { type: "string",   selector: ".title, .card-title", attribute: "textContent"                               },  // property ???
        }}
    }
}};


type WSC_Course_View_Get_Blocks_Message  = { id_act: "page-course-view-* get_blocks" };
type WSC_Course_View_Get_Blocks_Response = { blocks: WS_Block_1[] };


function wsc_course_view_get_blocks(_message: WSC_Course_View_Get_Blocks_Message): WSC_Course_View_Get_Blocks_Response {

    const blocks_html:  NodeListOf<Element>             = window.document.querySelectorAll(":root .block");    // :not([data-block='adminblock']) ???
    const response:     { blocks: WS_Block_1[] }   = { blocks: [] };
    for (const block_html of Object.values(blocks_html)) {
        const block_name:       string  = block_html.getAttribute("data-block") || throwf(new Error("WSC block get, block name not found."));
        if (block_name == "adminblock")  //  Skip "Add a block" psudo-block
            { continue; }
        const block_instanceid_str_match = (block_html.getAttribute("id")       || throwf(new Error("WSC block get, instance ID not found."))
                                           ).match(/^inst(\d+)$/)               || throwf(new Error("WSC block get, instance ID not recognised."));
        const block_instanceid: number  = parseInt(block_instanceid_str_match[1])
                                                                                || throwf(new Error("WSC block get, instance ID 0."));
        const block_region:     string  = (block_html.closest(".block-region")  || throwf(new Error("WSC block get, region not found."))
                                          ).getAttribute("data-blockregion")    || throwf(new Error("WSC block get, region type not found."));
        if (block_region == "side-pre" || block_region == "side-post") { /*OK*/ }
        else                                                                    { throw new Error("WSC block get, region type not recognised."); }

        const block_visible_x:  0|1     = block_html.classList.contains("invisible") ? 0 : 1;  // TODO: Fix for other Moodle versions?
        const block_title_x_html        = block_html.querySelector(":scope .title, :scope .card-title");
        const block_title_x             = block_title_x_html
                                            ? (block_title_x_html.textContent   || throwf(new Error("WSC block get, title not found")) )
                                            : undefined;  // TODO: Check when (if?) this happens.

        response.blocks.push({
            instanceid: block_instanceid,
            name:       block_name,
            region:     block_region,
            // positionid
            // collapsible
            // dockable
            visible_x:  block_visible_x,
            title_x:    block_title_x,
        });
    }
    return response;
}


type WSC_Course_View_Get_Contents_Message  = { id_act: "page-course-view-* get_contents", options?: WS_Course_Get_Contents_Option[] };
type WSC_Course_View_Get_Contents_Response = WS_Course_Section_W_Modules[];



function wsc_course_view_get_contents(message: WSC_Course_View_Get_Contents_Message): WSC_Course_View_Get_Contents_Response {
    // TODO: If sectionnumber specified, return only that section (happens anyway for onetopic courses).

    const options   = message.options   || [];
    let sectionnumber: number|undefined;
    let include_nested_x: boolean = false;
    for (const option of options) {
        switch (option.name) {
            case "sectionnumber":
                sectionnumber = option.value;
                break;
            case "include_nested_x":
                include_nested_x = true;
                break;
            default:
                never_call(option);
        }
    }

    const main_html:        Element             = window.document.querySelector(":root #region-main")
                                                                                || throwf(new Error("WSC course get content, main region not found."));

    const sections_html:    NodeListOf<Element> = main_html.querySelectorAll(":scope .main");
    const response:         WS_Course_Section_W_Modules[] = [];
    for (const section_html of Object.values(sections_html)) {
        const modules_html: NodeListOf<Element> = (section_html.querySelector(":scope > .content > .section")  // Note: flexsections can have nested sections.
                                                                                || throwf(new Error("WSC course get content, section content not found."))
                                                  ).querySelectorAll(":scope .activity");

        const modules:      WS_Module_1[] = [];
        for (const module_html of Object.values(modules_html)) {
            const module_id_str     = ((module_html.getAttribute("id")          || throwf(new Error("WSC course get content, mod ID not found."))
                                       ).match(/^module-(\d+)$/)                || throwf(new Error("WSC course get content, mod ID not recognised."))
                                      )[1];
            const module_modname    = (module_html.className.match(/(?:^|\s)modtype_([a-z]+)(?:\s|$)/)
                                                                                || throwf(new Error("WSC course get content, modname not found."))
                                      )[1];
            modules.push({
                id:         parseInt(module_id_str)                             || throwf(new Error("WSC course get content, mod ID 0")),
                name:       (module_modname == "label")
                            ? (module_html.querySelector(":scope .contentwithoutlink") || throwf(new Error("WSC course get content, label name not found."))
                              ).textContent || ""
                            : (module_html.querySelector(":scope .instancename") || throwf(new Error("WSC course get content, name not found."))
                              ).textContent || "",  // TODO: Use innerText to avoid unwanted hidden text with Assignments?
                            // TODO: Check handling of empty strings?
                            // TODO: For folder (to handle inline) if no .instancename, use .fp-filename ???
                modname:    module_modname,
                description: (module_modname == "label")  // TODO: Test
                            ? (module_html.querySelector(":scope .contentwithoutlink") || throwf(new Error("WSC course get content, label description not found."))
                              ).innerHTML
                            : (module_html.querySelector(":scope .contentafterlink") || { innerHTML: undefined }
                              ).innerHTML,
            });

        }

        // Note: Needs editing on.  Doesn't work for flexsections
        const section_id_str    = (((section_html.querySelector(":scope a.edit.menu-action") || throwf(new Error("WSC course get content, section edit menu not found."))
                                    ) as HTMLAnchorElement
                                   ).search.match(/(?:^\?|&)id=(\d+)(?:&|$)/)   || throwf(new Error("WSC course get content, section id not found."))
                                  )[1]; // TODO: Use URLSearchParams

        // Note: Needs editing on.  Doesn't work for onetopic
        // const section_id_str = (section_html.querySelector(":scope > .content > .sectionname .inplaceeditable")
        //                                                                        ||throwf(new Error("WSC course get content, section name edit not found.")
        //                       ).getAttribute("data-itemid")                    ||throwf(new Error("WSC course get content, section id not found.")

        // TODO: Try multiple methods?

        const section_summary_container_html = section_html.querySelector(":scope > .content > .summary")
                                                                                || throwf(new Error("WSC course get content, section summary container not found"));
        const section_summary_html  = section_summary_container_html.querySelector(":scope .no-overflow");

        const section_num_str       = ((section_html.getAttribute("id")         || throwf(new Error("WSC course get content, section num not found."))
                                       ).match(/^section-(\d+)$/)               || throwf(new Error("WSC course get content, section num not recognised."))
                                      )[1];

        response.push({
            id:         parseInt(section_id_str)                                || throwf(new Error("WSC course get content, seciton id 0.")),
            name:       (section_html.querySelector(":scope > .content > .sectionname") || throwf(new Error("WSC course get content, section name not found."))
                        ).textContent                                           || throwf(new Error("WSC course get content, section name text not found.")),
                        // TODO: Remove spurious whitespace.  Note: There may be hidden and visible section names?
            visible:    section_html.classList.contains("hidden") ? 0 : 1,
            summary:    section_summary_html ? section_summary_html.innerHTML : "",
            section:    parseInt(section_num_str),  // Note: can be 0
            modules:    modules,
        });
    }


    if (document.body.classList.contains("format-onetopic")) {

        // If top-level section, include lower-level section headings?  // TODO: Check
        // TODO: should be if ((include_nested_x || sectionnumber == undefined) ... ?
        if (include_nested_x && document.querySelector(":root #region-main ul.nav.nav-tabs:nth-child(2) li.active a div.tab_initial")) {
            const other_sections_html = document.querySelectorAll(":root #region-main ul.nav.nav-tabs:nth-child(2) li a[href*='/view.php']") as NodeListOf<HTMLAnchorElement>;
            for (const other_section_html of Object.values(other_sections_html)) {
                const section_match = other_section_html.href.match(/^(https?:\/\/[a-z\-.]+)\/course\/view.php\?id=(\d+)&section=(\d+)$/)
                                                                                || throwf(new Error("WSC course get content, tab links unrecognised."));
                const section_num = parseInt(section_match[3]);
                response.push({
                    id:         0,
                    name:       other_section_html.title,
                    summary:    "",
                    section:    section_num,
                    modules:    [],
                });  // TODO: Any better way to deal with these missing values? (Maybe not.)
            }
        }

        if (sectionnumber == undefined) {
            const other_sections_html = document.querySelectorAll(":root #region-main ul.nav.nav-tabs:first-child li a[href*='/view.php']") as NodeListOf<HTMLAnchorElement>;
            for (const other_section_html of Object.values(other_sections_html)) {
                const section_match = other_section_html.href.match(/^(https?:\/\/[a-z\-.]+)\/course\/view.php\?id=(\d+)&section=(\d+)$/)
                                                                                || throwf(new Error("WSC course get content, tab links unrecognised."));
                const section_num = parseInt(section_match[3]);
                response.push({
                    id:         0,
                    name:       other_section_html.title,
                    summary:    "",
                    section:    section_num,
                    modules:    [],
                });  // TODO: Any better way to deal with these missing values? (Maybe not.)
            }
        }

    }

    return response;
}




/*
 * Course: Edit Page
 */


type WSC_Course_Edit_Get_Message  = { id_act: "page-course-edit get" };
type WSC_Course_Edit_Get_Response = WS_Course_3;


function wsc_course_edit_get(_message: WSC_Course_Edit_Get_Message): WSC_Course_Edit_Get_Response {
    // const course_id = message.courseid;

    const course_html: HTMLFormElement = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course get, form not found."))
                                         ) as HTMLFormElement;

    const course_id_html:           Element|HTMLCollection  = course_html.elements.namedItem("id")
                                                                                || throwf(new Error("WSC course get, ID not found."));
    const course_fullname_html:     Element|HTMLCollection  = course_html.elements.namedItem("fullname")
                                                                                || throwf(new Error("WSC course get, fullname not found."));
    const course_format_html:       Element|HTMLCollection  = course_html.elements.namedItem("format")
                                                                                || throwf(new Error("WSC course get, format not found."));
    const course_completion_html:   Element|HTMLCollection  = course_html.elements.namedItem("enablecompletion")
                                                                                || throwf(new Error("WSC course get, completion not found."));

    if (   (course_id_html          instanceof HTMLInputElement  && course_id_html.type         == "hidden"    )
        && (course_fullname_html    instanceof HTMLInputElement  && course_fullname_html.type   == "text"      )
        && (course_format_html      instanceof HTMLSelectElement && course_format_html.type     == "select-one")
        && (course_completion_html  instanceof HTMLSelectElement && course_completion_html.type == "select-one") ) { /*OK*/ }
    else                                                                        { throw new Error("WSC course get, field type unexpected."); }

    const course_completion:    number  = parseInt(course_completion_html.value);
    if (course_completion == 0 || course_completion == 1) { /*OK*/ } else           { throw new Error("WSC course get, unexpected completion value."); }

    const course: WS_Course_3 = {
        id:                 parseInt(course_id_html.value),
        fullname:           course_fullname_html.value,
        format:             course_format_html.value,
        enablecompletion:   course_completion,
    };

    return course;
}


type WSC_Course_Edit_Set_Message  = { id_act: "page-course-edit set", course: Partial<WS_Course_3> };
type WSC_Course_Edit_Set_Response = void;


 async function wsc_course_edit_set(message: WSC_Course_Edit_Set_Message): Promise<WSC_Course_Edit_Set_Response> {
    // if (message.courses.length == 1) { /*OK*/ } else                            { throw new Error("WSC course update, parameter course unexpected."); }
    const course:       Partial<WS_Course_3>    = message.course;

    const course_html:  HTMLFormElement         = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course update, form not found."))
                                                  ) as HTMLFormElement;

    for (const course_key in course) if (course.hasOwnProperty(course_key)) {

        let course_key_html: string|null;
        switch (course_key) {
        case "id":
            course_key_html = null;
            break;
        case "fullname":
        case "enablecompletion":
            course_key_html = course_key;
            break;
        default:                                                                { throw new Error("WSC course update, property unrecognised."); }
        }

        if (course_key_html) {
            const course_value = course[course_key];
            if (course_value != undefined) { /*OK*/ } else                      { throw new Error("WSC course update, value undefined."); }
            const course_property_html: Element|HTMLCollection = course_html.elements.namedItem(course_key_html)
                                                                                || throwf(new Error("WSC course update, field not found."));
            if (   course_property_html instanceof HTMLInputElement  && course_property_html.type == "text"
                || course_property_html instanceof HTMLSelectElement && course_property_html.type == "select-one") {
                course_property_html.value = "" + course_value;
            } else                                                              { throw new Error("WSC course update, field type unexpected."); }
            await sleep(100);
        }

    }

    course_html.submit();
}




/*
 * Course: Completion Page
 */


type WSC_Course_Completion_Get_Message  = { id_act: "page-course-completion get" };
type WSC_Course_Completion_Get_Response = { mods: WS_Module_1[] };


function wsc_course_completion_get(_message: WSC_Course_Completion_Get_Message): WSC_Course_Completion_Get_Response {

    const fieldset_html: Element                    = window.document.querySelector(":root #id_activitiescompleted")
                                                                                || throwf(new Error("WSC course get modules w complete, data region not found."));
    const mods_html:    NodeListOf<Element>         = fieldset_html.querySelectorAll(":scope .fitem.fitem_fcheckbox, :scope .fitem.checkboxgroup1");
    // TODO: Find better way to do this?

    const mods:         WS_Module_1[]   = [];

    for (const mod_html of Object.values(mods_html)) {
        const mod_id_str        = (((mod_html.querySelector(":scope input")     || throwf(new Error("WSC course get modules w complete, field not found."))
                                    ).getAttribute("name")                      || throwf(new Error("WSC course get modules w complete, ID not found."))
                                   ).match(/^criteria_activity\[(\d+)\]$/)      || throwf(new Error("WSC course get modules w complete, ID not recognised."))
                                  )[1];
        const mod_label_text    = (mod_html.querySelector(":scope label")       || throwf(new Error("WSC course get modules w complete, label not found."))
                                  ).textContent                                 || throwf(new Error("WSC course get modules w complete, label text not found."));

        const mod_modname_display = mod_label_text.substr(0, mod_label_text.indexOf("-")).replace(/\s/g, " ").trim();
        let mod_modname: string|null = null;
        for (const moodle_mod of ws_mods) {
            if (mod_modname_display == moodle_mod.modname_display) {
                mod_modname = moodle_mod.modname;
            }
        }

        mods.push({
            id:         parseInt(mod_id_str)                                    || throwf(new Error("WSC course get modules w complete, ID 0.")),
            name:       mod_label_text.substr(mod_label_text.indexOf("-") + 1).trim(),
            modname:    mod_modname                                             || throwf(new Error("WSC course get modules w complete, mod type unrecognised.")),
        });
    }

    return {mods: mods};
}


/*
 * Course: Enrol Users Page
 */

type WSC_Course_Enrolled_Users_Get_Message  = { id_act: "page-enrol-users get" };
type WSC_Course_Enrolled_Users_Get_Response = WS_User_W_Roles[];


function wsc_course_enrolled_users_get(_message: WSC_Course_Enrolled_Users_Get_Message): WSC_Course_Enrolled_Users_Get_Response {
    if (window.document.body.getAttribute("id") == "page-enrol-users") { /*OK*/ }  // TODO: Check this outside?
    else                                                                        { throw new Error("WSC enrol get, page ID unexpected"); }

    const region_main_html: Element             = window.document.querySelector(":root #region-main")
                                                                                || throwf(new Error("WSC enrol get, main region not found."));
    const users_html:       NodeListOf<Element> = region_main_html.querySelectorAll(":scope .userinforow");  // .getElementsByTagName("tr");

    const response: WS_User_W_Roles[] = [];
    for (const user_html of Object.values(users_html)) {
        // if (user_row.getAttribute("class") == "") {
        const roles_html            = user_html.querySelectorAll(":scope .role");
        const roles: WS_Role[] = [];
        for (const role_html of Object.values(roles_html)) {
            const role_id:      number  = parseInt(role_html.classList[1].split("_")[1]); // TODO: Fix (especially for unchangable roles?)
            const role_name:    string  = role_html.textContent                 || throwf(new Error("WSC enrol get, role text not found."));
            roles.push({
                roleid: role_id,
                name:   role_name,
            });
        }
        const user_access_elapse_str:   string  = (user_html.querySelector(":scope .col_lastcourseaccess")
                                                                                || throwf(new Error("WSC enrol get, last access not found."))
                                                  ).textContent                 || throwf(new Error("WSC enrol get, last access text not found."));
                                                                    // .getElementsByClassName("c5")[0].textContent;
        let   user_access_elapse:       number|null;
        if (user_access_elapse_str == "Never") {
            user_access_elapse = null;
        } else if (user_access_elapse_str == "now") {
            user_access_elapse = 0;
        } else {
            const user_access_elapse_str_match =
                user_access_elapse_str.match(/^(\d+\syears?)?\s*(\d+\sdays?)?\s*(\d+\shours?)?\s*(\d+\smins?)?\s*(\d+\ssecs?)?$/)
                                                                                || throwf(new Error("WSC enrol get, time string unrecognised"));
            user_access_elapse = (
                (
                    (
                        (parseInt("0" + user_access_elapse_str_match[1]) * 365)
                                + parseInt("0" + user_access_elapse_str_match[2]) * 24
                    )
                            + parseInt("0" + user_access_elapse_str_match[3]) * 60
                )
                        + parseInt("0" + user_access_elapse_str_match[4]) * 60
            )
                    + parseInt("0" + user_access_elapse_str_match[5]);
        }
        const user_id_str:      string  = (user_html.getAttribute("id")         || throwf(new Error("WSC enrol get, ID not found."))
                                          ).split("_")[1];  // TODO: Fix, use match
        const user_fullname:    string  = (user_html.querySelector(":scope .subfield_userfullnamedisplay")
                                                                                || throwf(new Error("WSC enrol get, name not found."))
                                          ).textContent                         || throwf(new Error("WSC enrol get, name text not found."));
        const user_email:       string  = (user_html.querySelector(":scope .subfield_email")
                                                                                || throwf(new Error("WSC enrol get, email not found."))
                                          ).textContent                         || throwf(new Error("WSC enrol get, email text not found."));
        response.push({
            id:         parseInt(user_id_str),  // TODO: check
            fullname:   user_fullname,
            email:      user_email,
            lastaccess: user_access_elapse == null
                                              ? 0
                                              : Math.floor(Date.now() / 1000) - user_access_elapse,  // TODO: check
            // TODO: Include groups?
            roles: roles,
        });
        // }
    }
    return response;

}



/*
 * Course: Assignments Page
 */


type WSC_Course_Assigns_Get_Message  = { id_act: "page-mod-assign-index get"/*assign|turnitintool|turnitintooltwo*/ };
type WSC_Course_Assigns_Get_Response = { course: WS_Course_1_W_Assigns };


function wsc_course_assigns_get(_message: WSC_Course_Assigns_Get_Message): WSC_Course_Assigns_Get_Response {
    // if (message.courseids && message.courseids.length == 1) { /*OK*/ } else     { throw new Error("WSC assign get, one course expected."); }
    // const course_id = message.courseids[0];
    const course_id_str = ((" " + window.document.body.className + " ").match(/ course-(\d+) /)
                                                                                || throwf(new Error("WSC assign get, course ID not found."))
                          )[1];
    const course_id = parseInt(course_id_str);

    const course_breadcrumb_html    = (window.document.querySelector(":root .breadcrumb a[title]")
                                                                                || throwf(new Error("WSC assign get, course breadcrumb not found."))
                                      ) as HTMLAnchorElement;
    if (course_breadcrumb_html.pathname == "/course/view.php") { /*OK*/ } else  { throw new Error("WSC assign get, course breadcrumb not identified."); }
    const course_fullname           = course_breadcrumb_html.getAttribute("title")
                                                                                || throwf(new Error("WSC assign get, course fullname not found."));

    const main_html:    Element     = window.document.querySelector(":root #region-main")
                                                                                || throwf(new Error("WSC assign get, main region not found."));
    const assigns:      WS_Mod_Assign[] = [];

    // Check if there are assignments
    const alerts_html: NodeListOf<Element> = main_html.querySelectorAll(":scope .alert-block, :scope #notice, :scope .errorbox");
    if (alerts_html.length > 0) {
        const alert_text = alerts_html[0].textContent;
        if (alert_text && alert_text.replace(/\s/g, " ").match(/There are no (?:Turnitin )?Assignments/)) { /*OK*/ }
        else                                                                    { throw new Error("WSC assign get, unexpected error."); }
    } else {

        // Find which column has the assignment name and link
        const assigns_heading_html: Element     = main_html.querySelector(":scope thead tr")
                                                                                || throwf(new Error("WSC assign get, heading row not found."));
        let assigns_name_col:       number|null = null;
        let assigns_col_num:        number      = 0;
        for (const assigns_col_head_html of Object.values(assigns_heading_html.querySelectorAll(":scope th, :scope td"))) {
            if (assigns_col_head_html.textContent == "Assignments" || assigns_col_head_html.textContent == "Name") {
                assigns_name_col = assigns_col_num;
            }
            assigns_col_num = assigns_col_num + 1;
        }
        if (assigns_name_col != null) { /*OK*/ } else                           { throw new Error("WSC assign get, couldn't get name col num."); }

        const assigns_html = main_html.querySelectorAll(":scope tbody tr") as NodeListOf<HTMLTableRowElement>;
        for (const assign_html of Object.values(assigns_html)) {
            if (!assign_html.querySelector(":scope .tabledivider")) { /*OK*/ }
            else { continue; }
            const assign_anchor_html:   HTMLAnchorElement   = (assign_html.cells[assigns_name_col]).querySelector(":scope a")
                                                                                || throwf(new Error("WSC assign get, anchor not found"));
            const assign_cmid_str                           = (assign_anchor_html.search.match(/^\?id=(\d+)(?:&do=submissions)?$/)
                                                                                || throwf(new Error("WSC assign get, CMID not found."))
                                                              )[1];
            assigns.push({
                cmid:   parseInt(assign_cmid_str)                               || throwf(new Error("WSC assign get, CMID 0")),
                course: course_id,
                name:   assign_anchor_html.textContent                          || throwf(new Error("WSC assign get, name not found.")),
            });
        }
        if (assigns.length > 0) { /*OK*/ } else                                 { throw new Error("WSC assign get, could get assignments."); }
    }
    return {course: {id: course_id, fullname: course_fullname, assignments: assigns}};
}




/*
 * Course Category: View Page
 */



const wsc_course_category_index_meta: WSC_Page_Meta_Object =
                                { type: "object",       selector: "body",                                               properties: {
    id:                         { type: "number",       closest:  "body",                   attribute: "class",     value: "category-"  },
    name:                       { type: "string",       selector: "div.breadcrumb-nav .breadcrumb li:last-of-type a",
                                                                                            attribute:  "textContent"                   },
    description:                { type: "string",       selector: "#region-main div.box",   attribute: "innerHTML"                      }
}};



type WSC_Course_Category_Index_Get_Message  = { id_act: "page-course-index-category get_category" };
type WSC_Course_Category_Index_Get_Response = WS_Course_Category_1;


function wsc_course_category_index_get(_message: WSC_Course_Category_Index_Get_Message): WSC_Course_Category_Index_Get_Response {

    const breadcrumbs_html = window.document.querySelectorAll(":root div.breadcrumb-nav .breadcrumb li");  // :last-child or :last-of-type

    if (breadcrumbs_html.length > 0) { /*OK*/ } else                            { throw new Error("WSC category get displayed, breadcrumbs not found"); }

    const breadcrumb_last_html = breadcrumbs_html.item(breadcrumbs_html.length - 1);

    return {
        id:                 parseInt(
                                ((window.document.body.getAttribute("class")   || throwf(new Error("WSC category get displayed, body class not found."))
                                 ).match(/(?:^|\s)category-(\d+)(?:\s|$)/)      || throwf(new Error("WSC category get displayed, category not found."))
                                )[1],
                            ),
        name:               (breadcrumb_last_html.querySelector(":scope a")     || throwf(new Error("WSC category get displayed, breadcrumb link not found."))
                            ).textContent                                       || throwf(new Error("WSC category get displayed, name not found.")),
        description:        (window.document.querySelector(":root #region-main div.box.generalbox.info .no-overflow") || { innerHTML: "" }).innerHTML,
    };

}


type WSC_Course_Category_Index_Get_Courses_Message  = { id_act: "page-course-index-category get_courses" };
type WSC_Course_Category_Index_Get_Courses_Response = WS_Course_1[];


function wsc_course_category_index_get_courses(_message: WSC_Course_Category_Index_Get_Courses_Message): WSC_Course_Category_Index_Get_Courses_Response {

    const region_main_html: Element             = window.document.querySelector(":root #region-main")
                                                                                || throwf(new Error("WSC course get displayed, main region not found."));
    const courses_html:     NodeListOf<Element> = region_main_html.querySelectorAll(":scope .coursebox");
    const response:         WS_Course_1[]  = [];

    for (const course_html of Object.values(courses_html)) {
        const course_id_str         = course_html.getAttribute("data-courseid") || throwf(new Error("WSC course get displayed, ID not found."));
        const course_id:        number  = parseInt(course_id_str)               || throwf(new Error("WSC course get displayed, ID not recognised"));
        const course_fullname:  string  = (course_html.querySelector(":scope .coursename")
                                                                                || throwf(new Error("WSC course get displayed, name not found."))
                                          ).textContent                         || throwf(new Error("WSC course get displayed, name text not found."));
        response.push({
            id:       course_id,
            fullname: course_fullname,
        });
    }

    return response;
}


/*
 * Course Category: Edit Page
 */


const wsc_course_category_edit_meta: WSC_Page_Meta_Object =
                            { type: "object",   selector: "body",                                                   properties: {
    name:                   { type: "string",   selector: "[name='name']",                      attribute: "value"  },
    parent:                 { type: "number",   selector: "[name='parent']",                    attribute: "value"  },
    idnumber:               { type: "string",   selector: "[name='idnumber']",                  attribute: "value"  },
    description:            { type: "string",   selector: "[name='description_editor[text]']",  attribute: "value"  },
    description_format:     { type: "number",   selector: "[name='description_editor[format]'", attribute: "value"  }
}};


type WSC_Course_Category_Edit_Get_Message  = { id_act: "page-course-editcategory get" };
type WSC_Course_Category_Edit_Get_Response = WS_Course_Category_2;


function wsc_course_category_edit_get(_message: WSC_Course_Category_Edit_Get_Message): WSC_Course_Category_Edit_Get_Response {

    // const category_id_str = ((" " + window.document.body.className + " ").match(/ category-(\d+) /)
    //                                                                            || throwf(new Error("WSC category get, ID not found."))
    //                        )[1];
    // const category_id = parseInt(category_id_str);

    return {
        id:                 parseInt(
                                ((window.document.querySelector(":root #region-main form#mform1.mform input[name='id']")
                                                                                || throwf(new Error("WSC category get, ID not found."))
                                 ) as HTMLInputElement
                                ).value
                            ),
        name:               ((window.document.querySelector(":root #region-main form#mform1.mform input[name='name'][type='text']")
                                                                                || throwf(new Error("WSC category get, name not found."))
                             ) as HTMLInputElement
                            ).value,
        parent:             parseInt(
                                (((window.document.querySelector(":root #region-main form#mform1.mform select[name='parent']")
                                                                                || throwf(new Error("WSC category get, parent not found."))
                                  ) as HTMLSelectElement
                                 ).value.match(/^(\d+)$/)                       || throwf(new Error("WSC category get, parent not number."))
                                )[1],
                            ),
        idnumber:           ((window.document.querySelector(":root #region-main form#mform1.mform input[name='idnumber'][type='text']")
                                                                                || throwf(new Error("WSC category get, idnumber not found."))
                             ) as HTMLInputElement
                            ).value,
        description:        ((window.document.querySelector(":root #region-main form#mform1.mform textarea[name='description_editor[text]']")
                                                                                || throwf(new Error("WSC category get, description not found."))
                             ) as HTMLTextAreaElement
                            ).value,

        description_format: parseInt(
                                (((window.document.querySelector(":root #region-main form#mform1.mform input[name='description_editor[format]'][type='hidden']")
                                                                                || throwf(new Error("WSC category get, description format not found."))
                                  ) as HTMLInputElement
                                 ).value.match(/^([0124])$/)                    || throwf(new Error("WSC category get, description format not recognised."))
                                )[1],
                            ) as 0|1|2|4,
    };

}




/*
 * Course Section: Edit Page
 */


type WSC_Course_Section_Edit_Get_Message  = { id_act: "page-course-editsection get" };
type WSC_Course_Section_Edit_Get_Response = WS_Course_Section_1;


function wsc_course_section_edit_get(_message: WSC_Course_Section_Edit_Get_Message): WSC_Course_Section_Edit_Get_Response {
    // const section_id    = message.sectionid;

    const section_html:         HTMLFormElement         = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course get section, form not found."))
                                                          ) as HTMLFormElement;

    const section_id_html:      Element|HTMLCollection  = section_html.querySelector(":scope [name='id']")
                                                          || throwf(new Error("WSC course get section, ID not found."));

    const section_name_html:    Element|HTMLCollection  =    section_html.elements.namedItem("name")
                                                          || section_html.elements.namedItem("name[value]")
                                                                                || throwf(new Error("WSC course get section, name not found."));
    // TODO: Check for default name?
    // const section_usedefaultname_html:  Element|HTMLCollection = section_html.elements.namedItem("usedefaultname")
    //                                                                             ||throwf(new Error("WSC course get section, use default name not found.");

    const section_summary_html: Element|HTMLCollection  = section_html.elements.namedItem("summary_editor[text]")
                                                                                || throwf(new Error("WSC course get section, summary not found."));

    if (   (section_id_html      instanceof HTMLInputElement && section_id_html.type   == "hidden")
        && (section_name_html    instanceof HTMLInputElement && section_name_html.type == "text"  )
        && (section_summary_html instanceof HTMLTextAreaElement                                   )) { /*OK*/ }
    else                                                                        { throw new Error("WSC course get section, field type unexpected."); }

    const section: WS_Course_Section_1 = {
        id:                     parseInt(section_id_html.value),
        name:                   section_name_html.value,
        summary:                section_summary_html.value,
    };

    return section;
}


type WSC_Course_Section_Edit_Set_Message  = { id_act: "page-course-editsection set", section: Partial<WS_Course_Section_1>};
type WSC_Course_Section_Edit_Set_Response = void;


async function wsc_course_section_edit_set(message: WSC_Course_Section_Edit_Set_Message): Promise<WSC_Course_Section_Edit_Set_Response> {
    const section = message.section;
    const section_html: HTMLFormElement = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course update section, form not found."))
                                          ) as HTMLFormElement;

    for (const section_key in section) if (section.hasOwnProperty(section_key)) {

        let section_key_html: string|null;
        switch (section_key) {
        case "id":
            section_key_html = null;
            break;
        case "name":
            section_key_html = section_html.elements.namedItem("name") ? "name" : "name[value]";
            const name_default_html = section_html.elements.namedItem("usedefaultname");
            if (!name_default_html || name_default_html instanceof HTMLInputElement && name_default_html.type == "checkbox") { /*OK*/ }
            else                                                                { throw new Error("WSC course update section, name default field unrecognised."); }

            const name_customise_html = section_html.elements.namedItem("name[customise]");
            if (!name_customise_html || name_customise_html instanceof HTMLInputElement && name_customise_html.type == "checkbox") { /*OK*/ }
            else                                                                { throw new Error("WSC course update section, name customise field unrecognised."); }
            if (name_default_html) {
                name_default_html.checked = false;
                name_default_html.dispatchEvent(new Event("change"));
                await sleep(100);
            }
            if (name_customise_html) {
                name_customise_html.checked = true;
                name_customise_html.dispatchEvent(new Event("change"));
                await sleep(100);
            }
            break;
        case "summary":
            section_key_html = "summary_editor[text]";
            break;
        case "level_x":
            section_key_html = "level";
            break;
        case "section":
        case "modules":                                                         { throw new Error("WSC course update section, unsupported field."); }
        default:                                                                { throw new Error("WSC course update section, unrecognised field."); }
        }

        if (section_key_html) {
            const section_value = section[section_key];
            if (section_value != undefined) { /*OK*/ } else                     { throw new Error("WSC course update section, couldn't get value."); }
            const section_property_html = section_html.elements.namedItem(section_key_html);
            if (section_property_html) { /*OK*/ } else                          { throw new Error("WSC course update section, couldn't get field."); }

            if (   section_property_html instanceof HTMLInputElement  && section_property_html.type == "text"
                || section_property_html instanceof HTMLTextAreaElement
                || section_property_html instanceof HTMLSelectElement && section_property_html.type == "select-one") {
                section_property_html.value = "" + section_value;
            } else if (section_property_html instanceof HTMLInputElement && section_property_html.type == "checkbox") {
                section_property_html.checked = (section_value == section_property_html.value);  // TODO: throw error on unrecognised value?
            } else                                                              { throw new Error("WSC course update section, unrecognised field type."); }
            section_property_html.dispatchEvent(new Event("change"));
            await sleep(100);
        }

    }

    section_html.submit();
}



/*
 * Modules
 */



const ws_mods: Array<{modname: string, modname_display: string}> = [
    // TODO: Extract list? from "Add an activity" / "Add a resource" boxes?

    // Activities
    {modname: "assign",             modname_display: "Assignment"           },
    {modname: "attendance",         modname_display: "Attendance"           },
    {modname: "certificate",        modname_display: "Certificate"          },
    {modname: "chat",               modname_display: "Chat"                 },
    {modname: "choice",             modname_display: "Choice"               },
    {modname: "data",               modname_display: "Database"             },
    {modname: "lti",                modname_display: "External tool"        },
    {modname: "feedback",           modname_display: "Feedback"             },
    {modname: "forum",              modname_display: "Forum"                },
    {modname: "glossary",           modname_display: "Glossary"             },
    {modname: "hotpot",             modname_display: "HotPot"               },
    {modname: "hvp",                modname_display: "Interactive Content"  },
    {modname: "lesson",             modname_display: "Lesson"               },
    {modname: "questionnaire",      modname_display: "Questionnaire"        },
    {modname: "quiz",               modname_display: "Quiz"                 },
    {modname: "scorm",              modname_display: "SCORM package"        },
    {modname: "survey",             modname_display: "Survey"               },
    {modname: "turnitintool",       modname_display: "Turnitin Assignment"  },
    {modname: "turnitintooltwo",    modname_display: "Turnitin Assignment 2"},
    {modname: "wiki",               modname_display: "Wiki"                 },
    {modname: "workshop",           modname_display: "Workshop"             },

    // Resources
    {modname: "book",               modname_display: "Book"                 },
    {modname: "resource",           modname_display: "File"                 },
    {modname: "folder",             modname_display: "Folder"               },
    {modname: "imscp",              modname_display: "IMS content package"  },
    {modname: "label",              modname_display: "Label"                },
    {modname: "lightboxgallery",    modname_display: "Lightbox Gallery"     },
    {modname: "page",               modname_display: "Page"                 },
    {modname: "url",                modname_display: "URL"                  },
];






/*
 * Module: Edit Page
 */

type WSC_Module_Edit_Get_Message  = { id_act: "page-mod-*-mod get" };
type WSC_Module_Edit_Get_Response = { cm: WS_Module_2 };


function wsc_module_edit_get(_message: WSC_Module_Edit_Get_Message): WSC_Module_Edit_Get_Response {
    // const cmid = message.cmid;
    const module_html:              HTMLFormElement         = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course get module, form not found."))
                                                              ) as HTMLFormElement;

    const module_id_html:           Element|HTMLCollection  = module_html.elements.namedItem("coursemodule")
                                                                                || throwf(new Error("WSC course get module, ID not found."));
    const module_instance_html:     Element|HTMLCollection  = module_html.elements.namedItem("instance")
                                                                                || throwf(new Error("WSC course get module, instance ID not found."));
    const module_course_html:       Element|HTMLCollection  = module_html.elements.namedItem("course")
                                                                                || throwf(new Error("WSC course get module, course ID not found."));
    const module_modname_html:      Element|HTMLCollection  = module_html.elements.namedItem("modulename")
                                                                                || throwf(new Error("WSC course get module, modname not found."));
    const module_description_html:  Element|HTMLCollection = module_html.elements.namedItem("introeditor[text]")
                                                                                || throwf(new Error("WSC course get module, description not found."));

    const module_name_html:                                     Element|HTMLCollection|null = module_html.elements.namedItem("name");
    // TODO: For label, instead of name field, use introeditor[text] field (without markup)?

    const module_completion_html:   Element|HTMLCollection|null = module_html.elements.namedItem("completion");

    // For assignments
    const module_assignsubmission_file_enabled_x_html:          Element|HTMLCollection|null = module_html.elements.namedItem("assignsubmission_file_enabled");
    const module_assignsubmission_onlinetext_enabled_x_html:    Element|HTMLCollection|null =
                                                                                        module_html.elements.namedItem("assignsubmission_onlinetext_enabled");

    // TODO: Add these
    // const module_completionview_x_html:     Element|HTMLCollection|null = module_html.elements.namedItem("completionview");
    // const module_completionusegrade_x_html: Element|HTMLCollection|null = module_html.elements.namedItem("completionusegrade");
    // const module_completionsubmit_x_html:   Element|HTMLCollection|null = module_html.elements.namedItem("completionsubmit");

    if (   (    module_id_html          instanceof HTMLInputElement  && module_id_html.type         == "hidden"     )
        && (    module_instance_html    instanceof HTMLInputElement  && module_instance_html.type   == "hidden"     )
        && (    module_course_html      instanceof HTMLInputElement  && module_course_html.type     == "hidden"     )
        && (    module_modname_html     instanceof HTMLInputElement  && module_modname_html.type    == "hidden"     )
        && (    module_description_html instanceof HTMLTextAreaElement                                              ) ) { /*OK*/ }
    else                                                                        { throw new Error("WSC course get module, field type unexpected."); }

    if (   (      !module_name_html
            || (   module_name_html                                  instanceof HTMLInputElement
                && module_name_html.type                                  == "text"    ))
        &&  (     !module_completion_html
            || (   module_completion_html                           instanceof HTMLSelectElement
                && module_completion_html.type                            == "select-one")
            || (   module_completion_html                           instanceof HTMLInputElement
                && module_completion_html.type                            == "hidden"  ))
        && (      !module_assignsubmission_file_enabled_x_html
            || (   module_assignsubmission_file_enabled_x_html       instanceof HTMLInputElement
                && module_assignsubmission_file_enabled_x_html.type       == "checkbox"))
        && (      !module_assignsubmission_onlinetext_enabled_x_html
            || (   module_assignsubmission_onlinetext_enabled_x_html instanceof HTMLInputElement
                && module_assignsubmission_onlinetext_enabled_x_html.type == "checkbox")))
    { /*OK*/ } else                                                             { throw new Error("WSC course get module, optional field type unexpected."); }

    // if (!module_completionview_x_html     || module_completionview_x_html     instanceof HTMLInputElement) { /*OK*/ }
    // else                                                                     { throw new Error("In module, couldn't get completion view."); }
    // if (!module_completionusegrade_x_html || module_completionusegrade_x_html instanceof HTMLInputElement) { /*OK*/ }
    // else                                                                     { throw new Error("In module, couldn't get completion grade."); }
    // if (!module_completionsubmit_x_html   || module_completionsubmit_x_html   instanceof HTMLInputElement) { /*OK*/ }
    //                                                                          { throw new Error("In module, couldn't get completion submit."); }

    const module_completion: number = module_completion_html ? parseInt(module_completion_html.value) : 0;
    if (module_completion == 0 || module_completion == 1 || module_completion == 2) { /*OK*/ }
    else                                                                        { throw new Error("WSC course get module, completion value unexpected."); }

    const module_assignsubmission_file_enabled_x:       0|1|undefined   = module_assignsubmission_file_enabled_x_html
                                                                          ? (module_assignsubmission_file_enabled_x_html.checked ? 1 : 0)       : undefined;
    const module_assignsubmission_onlinetext_enabled_x: 0|1|undefined   = module_assignsubmission_onlinetext_enabled_x_html
                                                                          ? (module_assignsubmission_onlinetext_enabled_x_html.checked ? 1 : 0) : undefined;

    // TODO: Fix to handle checkboxes appropriately (as above)
    // const module_completionview_x:     number|undefined = module_completionview_x_html     ? parseInt(module_completionview_x_html.value)     : undefined;
    // const module_completionusegrade_x: number|undefined = module_completionusegrade_x_html ? parseInt(module_completionusegrade_x_html.value) : undefined;
    // const module_completionsubmit_x:   number|undefined = module_completionsubmit_x_html   ? parseInt(module_completionsubmit_x_html.value)   : undefined;

    const module: WS_Module_2 = {
        id:             parseInt(module_id_html.value),
        instance:       parseInt(module_instance_html.value)                    || throwf(new Error("WSC course get module, instance ID not recognised")),
        course:         parseInt(module_course_html.value)                      || throwf(new Error("WSC course get module, course ID not recognised")),
        sectionnum:     parseInt(((window.document.querySelector(":root form#mform1 input[name='section'][type='hidden']")
                                                                                || throwf(new Error("WSC course get module, section num not found."))
                                  ) as HTMLInputElement).value),
        name:           module_name_html ? module_name_html.value : "",
        modname:        module_modname_html.value,
        completion:     module_completion,
        description:    module_description_html.value,

        assignsubmission_file_enabled_x:        module_assignsubmission_file_enabled_x,
        assignsubmission_onlinetext_enabled_x:  module_assignsubmission_onlinetext_enabled_x,
        // completionview_x:                    module_completionview_x,
        // completionusegrade_x:                module_completionusegrade_x,
        // completionsubmit_x:                  module_completionsubmit_x
    };

    return {cm: module};
}


type WSC_Module_Edit_Set_Message  = { id_act: "page-mod-*-mod set", cm: Partial<WS_Module_2>/*&Pick<WS_Module_2, "id">*/};
type WSC_Module_Edit_Set_Response = void;


async function wsc_module_edit_set(message: WSC_Module_Edit_Set_Message): Promise<WSC_Module_Edit_Set_Response> {
    const cm = message.cm;

    const cm_html:              HTMLFormElement             = (window.document.querySelector(":root form#mform1")
                                                                                || throwf(new Error("WSC course update module, form not found."))
                                                              ) as HTMLFormElement;  // TODO: Figure out why got this error.

    if (cm.completion != undefined) {

        // Get completion details
        const cm_completion_html:   Element|HTMLCollection      = cm_html.elements.namedItem("completion")
                                                                                || throwf(new Error("WSC course update module, completion not found."));
        if (   cm_completion_html instanceof HTMLInputElement  && cm_completion_html.type == "hidden"
            || cm_completion_html instanceof HTMLSelectElement && cm_completion_html.type == "select-one") { /*OK*/ }
        else                                                                    { throw new Error("WSC course update module, completion not recognised."); }
        const cm_unlock_html:       Element|HTMLCollection|null = cm_html.elements.namedItem("unlockcompletion");
        if (!cm_unlock_html || (cm_unlock_html instanceof HTMLInputElement && cm_unlock_html.type == "submit")) { /*OK*/ }
        else                                                                    { throw new Error("WSC course update module, unlock button not recognised."); }

        // Unlock completion options if necessary
        if (cm.completion == undefined || cm.completion == parseInt(cm_completion_html.value) || !cm_unlock_html) { /*OK*/ }
        else {
            cm_unlock_html.click();     // TODO: Don't throw error?
                                                                                { throw new Error("WSC course update module, unlock needed."); } // Caught
        }

    }

    for (const cm_key in cm) if (cm.hasOwnProperty(cm_key)) {

        // Get field name
        let cm_key_html: string|null;
        let cm_readonly = false;
        switch (cm_key) {
        case "course":
            cm_key_html = cm_key;
            cm_readonly = true;
            break;
        case "sectionnum":
            cm_key_html = "section";
            cm_readonly = true;     // Not really read only, but can't be changed from here.
            break;
        case "id":
            cm_key_html = "coursemodule";
            cm_readonly = true;
            break;
        case "modname":
            cm_key_html = "modulename";
            cm_readonly = true;
            break;
        case "name":
        case "completion":
            cm_key_html = cm_key;
            break;
        case "description":
            cm_key_html = "introeditor[text]";  // TODO: Test
            break;
        case "completionview_x":
        case "completionusegrade_x":
        case "completionsubmit_x":
            if (cm.completion == 2) { /*OK*/ } else                             { throw new Error("WSC course update module, completion option inapplicable"); }
            cm_key_html = cm_key.split("_")[0];
            break;
        default:                                                                { throw new Error("WSC course update module, property not recognised: " + cm_key); }
        }

        // Find field
        const cm_property_html = cm_html.elements.namedItem(cm_key_html);
        if (cm_property_html) { /*OK*/ } else                                   { throw new Error("WSC course update module, field not found: " + cm_key); }

        // Get existing field value
        let cm_value_html: string;
        if (   cm_property_html instanceof HTMLInputElement  && (   cm_property_html.type == "text"
                                                                 || cm_property_html.type == "hidden")
            || cm_property_html instanceof HTMLTextAreaElement
            || cm_property_html instanceof HTMLSelectElement && cm_property_html.type == "select-one" ) {
            cm_value_html = cm_property_html.value;
        } else if (cm_property_html instanceof HTMLInputElement && cm_property_html.type == "checkbox") {
            if (cm_property_html.value == "1") { /*OK*/ } else                  { throw new Error("WSC course update module, tick box value unrecognised"); }
            cm_value_html = cm_property_html.checked ? cm_property_html.value : "0";
        } else                                                                  { throw new Error("WSC course update module, reading field type unrecognised."); }

        // Get new value
        const cm_value = cm[cm_key];
        if (cm_value != undefined) { /*OK*/ } else                              { throw new Error("WSC course update module, value undefined."); }

        // Check or change
        if (cm_readonly) {
            if ("" + cm_value == cm_value_html) { /*OK*/ } else                 { throw new Error("WSC course update module, field value mismatch."); }
        } else if ("" + cm_value != cm_value_html) {
            if (   cm_property_html instanceof HTMLInputElement  && cm_property_html.type == "text"
                || cm_property_html instanceof HTMLTextAreaElement
                || cm_property_html instanceof HTMLSelectElement && cm_property_html.type == "select-one" ) {
                cm_property_html.value = "" + cm_value;
            } else if (cm_property_html instanceof HTMLInputElement && cm_property_html.type == "checkbox") {
                cm_property_html.checked = (cm_value == cm_property_html.value);  // TODO: Throw error on unexpected value?
            } else                                                              { throw new Error("WSC course update module, writing field type unrecognised."); }
            cm_property_html.dispatchEvent(new Event("change"));
            await sleep(100);
        }

    }
    cm_html.submit();
}





/*
 * Call Init
 */

if (window.location.protocol.match(/^https?:$/)) {
    /*return*/ wsc_init();
} else                                                                          { throw new Error("WS call init, execution context not recognised."); }
