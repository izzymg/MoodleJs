/*
 * Moodle JS Misc Routines
 * Used in web services and content scripts.
 */


function sleep(time: number): Promise<{}> { return new Promise((resolve) => setTimeout(resolve, time)); }
function throwf(err: Error): never                                              { throw err; }
function never_call(_never_var: never): never /* Shouldn't ever happen */       { throw new Error("WSM never call, unexpected case."); }
