/*
 * Moodle JS Background Script
 * Listens for button click, and opens panel.
 */


var   opb_clicked_tab:  browser.tabs.Tab|null       = null;
const opb_panel_ids:    { [index: number]: number } = { };

interface OPB_Page {
    opb_clicked_tab: browser.tabs.Tab|null;
}


async function opb_panel_open(active_tab: browser.tabs.Tab): Promise<void> {
    if (active_tab.id) { /*OK*/ } else                                          { throw new Error("OPB panel open, couldn't get active tab ID."); }
    if (!opb_clicked_tab) { /*OK*/ } else                                       { throw new Error("OPB panel open, tab ID exists from previous attempt."); }

    opb_clicked_tab = active_tab;
    if (opb_clicked_tab.id) { /*OK*/ } else                                     { throw new Error("OPB panel open, tab ID lost in transit."); }

    if (opb_panel_ids[opb_clicked_tab.id]) {
        try {
            await browser.windows.update(opb_panel_ids[opb_clicked_tab.id], {focused: true});
            if (opb_clicked_tab) { /*OK*/ } else                                { throw new Error("OPB panel open, tab ID lost after focus."); }
            opb_clicked_tab = null;
        } catch (err) {
            if (   err.message == "Invalid window ID: " + opb_panel_ids[opb_clicked_tab.id]         /* Firefox 57 */
                || err.message == "An unexpected error occurred"                                    /* Firefox 52 */
                || err.message == "No window with id: " + opb_panel_ids[opb_clicked_tab.id] + "."   /* Chrome 63 */ ) { /*OK*/ }
            else                                                                { throw err; }
            if (opb_clicked_tab) { /*OK*/ } else                                { throw new Error("OPB panel open, tab ID lost after focus attempt."); }
            delete opb_panel_ids[opb_clicked_tab.id];
        }
    }

    if (opb_clicked_tab) {
        const url       = browser.extension.getURL("op_panel.htm");
        const new_win   = await browser.windows.create({type: "panel", url: url, width: 256, height: 640});
        if (new_win.id) { /*OK*/ } else                                         { throw new Error("OPB panel open, couldn't get new window ID."); }

        if (opb_clicked_tab && opb_clicked_tab.id) { /*OK*/ } else              { throw new Error("OPB panel open, tab ID lost after window creation."); }
        if (!opb_panel_ids[opb_clicked_tab.id]) { /*OK*/ } else                 { throw new Error("OPB panel open, previous panel associated with tab ID."); }
        opb_panel_ids[opb_clicked_tab.id] = new_win.id;
    }

}


browser.browserAction.onClicked.addListener(opb_panel_open);
