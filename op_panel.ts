/*
 * Moodle JS OP Panel Script
 * UI glue scripts.
 */


let opp_form:       {elements: OPP_Elements};
let opp_progress:   HTMLProgressElement;

let opp_state:      -1|0|1;     // error / ready / busy
let opp_tab:        browser.tabs.Tab|null = null;


// TODO: Figure out why problems occur sometimes when a tab is dragged to another window.


interface OPP_Elements {

    wwwroot:            HTMLInputElement;

    courses:            HTMLSelectElement;
    courses_get:        HTMLButtonElement;

    roles_check:        HTMLButtonElement;
    template_check:     HTMLButtonElement;
    remove_gs:          HTMLButtonElement;
    replace_mm:         HTMLButtonElement;
    progress_update:    HTMLButtonElement;

    new:                NodeList & {value: "course" | "section_top" | "section_sub" | ""} & {[index: number]: HTMLInputElement};
    new_name:           HTMLInputElement;
    new_name_short:     HTMLInputElement;
    new_start:          HTMLInputElement;
    new_create:         HTMLButtonElement;

    modules_toc_update: HTMLButtonElement;

    test:               HTMLButtonElement;
    test_token:         HTMLInputElement;

    info:               HTMLTextAreaElement;
}

function opp_elements_typeguard(pe: Partial<OPP_Elements>): pe is OPP_Elements {
    return (typeof pe == "object" && pe
        && pe.wwwroot           instanceof HTMLInputElement
        && pe.courses           instanceof HTMLSelectElement
        && pe.courses_get       instanceof HTMLButtonElement
        && pe.roles_check       instanceof HTMLButtonElement
        && pe.progress_update   instanceof HTMLButtonElement
        && pe.remove_gs         instanceof HTMLButtonElement
        && pe.replace_mm        instanceof HTMLButtonElement
        && pe.new               instanceof NodeList && typeof pe.new.value == "string"
        && pe.new_name          instanceof HTMLInputElement
        && pe.new_name_short    instanceof HTMLInputElement
        && pe.new_start         instanceof HTMLInputElement
        && pe.new_create        instanceof HTMLButtonElement
        && pe.test              instanceof HTMLButtonElement
        && pe.test_token        instanceof HTMLInputElement
        && pe.info              instanceof HTMLTextAreaElement );
}


function opb_typeguard(bg: Partial<OPB_Page>): bg is OPB_Page {  // TODO: Improve
    return (typeof bg == "object" && bg && typeof bg.opb_clicked_tab == "object"
            && (  bg.opb_clicked_tab == null
                || (   typeof bg.opb_clicked_tab.active == "boolean" && typeof bg.opb_clicked_tab.windowId == "number"
                    && (typeof bg.opb_clicked_tab.id == "undefined" || typeof bg.opb_clicked_tab.id == "number"))));
}


async function opp_init(): Promise<boolean> {

    // Get and clear the tab ID first, to make sure we don't lock up the background script if something goes wrong.
    const bgp = await browser.runtime.getBackgroundPage() as Partial<OPB_Page>;  // casting to any gives no type checking
    if (opb_typeguard(bgp)) { /*OK*/ } else                                     { throw new Error("Couldn't get background page."); }
    opp_tab = bgp.opb_clicked_tab;
    bgp.opb_clicked_tab = null;
    if (opp_tab && opp_tab.id) { /*OK*/ } else                                  { throw new Error("Couldn't get tab id."); }

    const opp_form_elements_temp = document.forms[0].elements as Partial<OPP_Elements>;  // casting to any gives no type checking
    if (opp_elements_typeguard(opp_form_elements_temp)) {/*OK*/} else           { throw new Error("Couldn't get panel elements."); }
    opp_form = {elements: opp_form_elements_temp};

    const opp_progress_temp = document.querySelector("progress");
    if (opp_progress_temp instanceof HTMLProgressElement) {/*OK*/} else         { throw new Error("Couldn't get progress bar."); }
    opp_progress = opp_progress_temp;

    opp_form.elements.courses_get.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_get();
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });

    opp_form.elements.roles_check.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_roles_check(opp_form.elements.courses.selectedIndex);
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });


    opp_form.elements.template_check.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_template_check(opp_form.elements.courses.selectedIndex);
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });


    opp_form.elements.remove_gs.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_remove_getting_started(opp_form.elements.courses.selectedIndex);
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });

    opp_form.elements.replace_mm.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_replace_my_moodle(opp_form.elements.courses.selectedIndex);
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });


    opp_form.elements.progress_update.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_course_list_change_progress_block(opp_form.elements.courses.selectedIndex);
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });


    opp_form.elements.new.item(0).addEventListener("click", opp_new_on_set_mode);
    opp_form.elements.new.item(1).addEventListener("click", opp_new_on_set_mode);
    opp_form.elements.new.item(2).addEventListener("click", opp_new_on_set_mode);

    opp_form.elements.new_name.addEventListener("input", opp_new_button_show_enabled);
    opp_form.elements.new_name_short.addEventListener("input", opp_new_button_show_enabled);

    opp_form.elements.new_create.addEventListener("click", opp_new_create);

    opp_form.elements.modules_toc_update.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await opm_index_rebuild();
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });

    opp_form.elements.test.addEventListener("click", async function() {
        opp_set_state(1);
        try {
            await ws_test(opp_form.elements.test_token.value, parseInt(opp_form.elements.courses.selectedOptions[0].value));
            opp_set_state(0);
        } catch (err) {
            opp_set_state(-1);
            alert(err);
        }
    });



    browser.tabs.onUpdated.addListener(opp_on_tab_updated);
    browser.tabs.onActivated.addListener(opp_on_tab_activated);
    browser.tabs.onAttached.addListener(opp_on_tab_attached);
    browser.tabs.onRemoved.addListener(opp_on_tab_removed);
    window.addEventListener("beforeunload", opp_close);

    opp_set_state(1);
    let result: boolean;
    try {
        await opm_init(opp_tab.id, opp_progress);
        opp_set_state(0);
        result = true;
    } catch (err) {
        opp_set_state(-1);
        alert (err.message);
        result = false;
    }
    return result;
}


async function opp_on_tab_updated(tab_id: number, _update_info: Partial<browser.tabs.Tab>, _tab: browser.tabs.Tab): Promise<void> {
    if (opp_tab && tab_id == opp_tab.id) {
        opp_badge_show_ready();
    }
}


async function opp_on_tab_activated(arg: {tabId: number, windowId: number}) {
    if (opp_tab && arg.tabId == opp_tab.id) {
        opp_tab.active = true;
    } else if (opp_tab && arg.windowId == opp_tab.windowId) {
        opp_tab.active = false;
    }
    opp_show_enabled();
}


async function opp_on_tab_attached(tabId: number, attachInfo: {newWindowId: number, newPosition: number}) {
    if (opp_tab && tabId == opp_tab.id) {
        opp_tab.windowId = attachInfo.newWindowId;
    }
}


async function opp_on_tab_removed(tabId: number, _removeInfo: {windowId: number, isWindowClosing: boolean}) {
    if (opp_tab && tabId == opp_tab.id) {
        opp_tab = null;
        opp_show_enabled();
    }
}


async function opp_close(): Promise<void> {
    if (opp_tab) {
        browser.browserAction.setBadgeText({text: "", tabId: opp_tab.id});
        // await browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: opp_tab.id});
    }
}


async function opp_new_create() {
    opp_set_state(1);
    // TODO: If short name is blank, copy full name?
    try {
        switch (opp_form.elements.new.value) {
        case "course":
            await opm_new_shell(opp_form.elements.new_name.value.trim(), opp_form.elements.new_name_short.value.trim(), opp_form.elements.new_start.valueAsDate.getTime() / 1000);
            break;
        case "section_top":
            await opm_new_section(opp_form.elements.new_name.value.trim(), opp_form.elements.new_name_short.value.trim());
            break;
        case "section_sub":
            await opm_new_topic(opp_form.elements.new_name.value.trim());
            break;
        default:                                                                { throw new Error("Create new type unrecognised."); }
        }
        opp_new_reset();
        opp_set_state(0);
    } catch (err) {
        opp_set_state(-1);
        alert(err);
    }
}


function opp_new_reset(): void {
    // opp_form.elements.new.value        = ""; // TODO: Doesn't work? Fix
    opp_new_on_set_mode();
}


function opp_set_state(state: -1|0|1): void {
    opp_state = state;
    opp_show_enabled();
    opp_badge_show_ready();
}


function opp_show_enabled(): void {
    const opp_enabled = !opp_state && opp_tab && opp_tab.active;
    opp_form.elements.courses.disabled            = !opp_enabled;
    opp_form.elements.courses_get.disabled        = !opp_enabled;
    opp_form.elements.roles_check.disabled        = !opp_enabled;
    opp_form.elements.template_check.disabled     = !opp_enabled;
    opp_form.elements.remove_gs.disabled          = !opp_enabled;
    opp_form.elements.replace_mm.disabled         = !opp_enabled;
    opp_form.elements.progress_update.disabled    = !opp_enabled;
    opp_form.elements.new[0].disabled             = !opp_enabled;
    opp_form.elements.new[1].disabled             = !opp_enabled;
    opp_form.elements.new[2].disabled             = !opp_enabled;
    opp_new_details_show_enabled();
    opp_form.elements.modules_toc_update.disabled = !opp_enabled;
    opp_form.elements.test.disabled               = !opp_enabled;
}



function opp_new_on_set_mode(): void {
    opp_new_details_show_enabled();
    opp_form.elements.new_name.value          = "";
    opp_form.elements.new_name_short.value    = "";
    opp_form.elements.new_start.value         = "2018-01-01";   // TODO: Set to current year?
}


function opp_new_details_show_enabled(): void {
    const opp_enabled = !opp_state && opp_tab && opp_tab.active;

    opp_form.elements.new_name.disabled          = !(opp_enabled && opp_form.elements.new.value);
    opp_form.elements.new_name_short.disabled    = !(opp_enabled && opp_form.elements.new.value && opp_form.elements.new.value != "section_sub");
    opp_form.elements.new_start.disabled         = !(opp_enabled && opp_form.elements.new.value && opp_form.elements.new.value == "course");
    opp_new_button_show_enabled();
}


function opp_new_button_show_enabled(): void {
    // TODO: Make short name optional?
    const opp_enabled = !opp_state && opp_tab && opp_tab.active;
    opp_form.elements.new_create.disabled   = !(opp_enabled && opp_form.elements.new.value != ""
                                                            && opp_form.elements.new_name.value.trim() != ""
                                                            && (opp_form.elements.new_name_short.value.trim() != "" || opp_form.elements.new.value == "section_sub"));
}


function opp_badge_show_ready(): void {
    if (opp_tab) { /*OK*/ } else                                                { throw new Error("Tab not found."); }
    if (opp_state == 0) {
        browser.browserAction.setBadgeBackgroundColor({color: "green", tabId: opp_tab.id});
        browser.browserAction.setBadgeText({text: "||", tabId: opp_tab.id});
    } else if (opp_state == 1) {
        browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: opp_tab.id});
        browser.browserAction.setBadgeText({text: ">", tabId: opp_tab.id});
    } else {
        browser.browserAction.setBadgeBackgroundColor({color: "red", tabId: opp_tab.id});
        browser.browserAction.setBadgeText({text: "X", tabId: opp_tab.id});
    }
}



function opp_wwwroot_update() {
    opp_form.elements.wwwroot.value = ws_wwwroot;
}


function opp_info_add(message_full: string) {
    opp_form.elements.info.value         += message_full;
}

function opp_course_list_update() {
    // Empty the course list display
    while (opp_form.elements.courses.options.length > 0) {
        opp_form.elements.courses.remove(opp_form.elements.courses.options.length - 1);
    }

    // Add the new course list to the display
    for (const course of opm_course_list) {
        if (course.id) { /*OK*/ } else                                          { throw new Error("Missing course ID."); }
        opp_form.elements.courses.add(new Option(course.fullname, "" + course.id));
    }
    opp_form.elements.courses.selectedIndex = 0;
}

function opp_course_current_update() {
    opp_form.elements.courses.selectedIndex = opm_course_current;
}



/*
 * Call Init
 */


void opp_init();
