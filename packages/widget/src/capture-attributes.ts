// Attributes that decide what leaves the page in a Recording or a Screenshot.

/** On the Widget's own elements: never captured. */
export const WIDGET_ATTRIBUTE = "data-ff-widget";
/** Set by the site: the element's text and its descendants' become `*` in a Recording. */
export const MASK_ATTRIBUTE = "data-ff-mask";
/** Set by the site: the element is a same-size placeholder in a Recording and absent from the Screenshot. */
export const BLOCK_ATTRIBUTE = "data-ff-block";
