
export interface ExternalCssSheetResource {
  type: "external_css_sheet"
  resourceId: string 
  originalUrl: string
  // attributes that were removed.. for debugging mainly... ? 
  attributes: Record<string, string>;
}

export interface ExternalImageResourcee {
  type: "external_img" 
  resourceId: string 
  originalUrl: string
  // attributes that were removed.. for debugging mainly... ? 
  attributes: Record<string, string>;
}

export interface InlineCssSheetResource {
  type: "internal_css_sheet"
  resourceId: string 
  cssRules: string[]
}

export interface DataUriImageResource {
  type: "datauri_image" 
  resourceId: string
  originalUrl: string
}

export type ExternalPageResource = ExternalCssSheetResource | ExternalImageResourcee 

export type EmbeddedPageResource = InlineCssSheetResource | DataUriImageResource

export type PageResource = ExternalPageResource | EmbeddedPageResource; 


export async function archivePagePass0(insertRebase = false, htmlString: string = '', url: string = '', parser = new DOMParser()) {

  let embed = true; 

  // Helper function to remove an attribute from an element and record 
  // the removal into an attributes object.
  function removeAttrib(attributes: Record<string, string>, element: HTMLElement, name: string) {
    const val = element.getAttribute(name); 
    if (val !== null) {
      attributes[name] = val
      element.removeAttribute(name)
    }
  }

  function getDocTypeString(document: Document) {
    const node = document.doctype;
    if (!node) {
      return null;
    }
    const html = 
    "<!DOCTYPE "
      + node.name
      + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
      + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
      + (node.systemId ? ' "' + node.systemId + '"' : '')
      + '>';
    return html; 
  }

  function getCssSheetText(sheet: CSSStyleSheet) {
    let text = '';
    for (let i = 0; i < sheet.cssRules.length; i++) {
      text += `${sheet.cssRules[i].cssText}\n`;
    }
    return text;
  }

  let doc: Document;
  
  if (!htmlString) {
    doc = document;
  }
  else {
    doc = parser.parseFromString(htmlString, "text/html");
  }
  
  if (!url) {
    url = doc.location.href; 
  }

  /*let styleSheets = doc.querySelectorAll(
    'link[rel="stylesheet"],link[rel="preload"][as="style"]'
  );*/
  let styleSheets = Array.from(doc.styleSheets);

  let scripts = doc.querySelectorAll("script");
  let noScripts = doc.querySelectorAll("noscript");
  let images = doc.querySelectorAll("img");
  let iframes = doc.querySelectorAll("iframe");

  if (insertRebase) {
    let rebase = doc.createElement("base");
    rebase.setAttribute("href", url);
    doc.head.appendChild(rebase);
  }

  let touchedIdCounter = 0;

  const resources: PageResource[] = []

  let styleSheetPromises = styleSheets.map(async styleSheet => {
    
    
    // Incremenet touchedId. 
    let touchedId = (++touchedIdCounter).toString();

    try {

      // TODO: we are not covereing all cases here like, see: 
      // https://developer.mozilla.org/en-US/docs/Web/API/StyleSheet
      // and related speecs, wrt to @import and XML?? sheets.

      // External style style, ie, a <link> element.
      if (styleSheet.ownerNode && styleSheet.href) {

        let href = (styleSheet.ownerNode as any).getAttribute("href");
        let absoluteURL = href && new URL(href, url).toString();
        (styleSheet.ownerNode as any).setAttribute("href", `replaced://${touchedId}`);
        (styleSheet.ownerNode as any).setAttribute("data-archiver-fab-id", touchedId);
        resources.push({
          type: "external_css_sheet",
          resourceId: touchedId, 
          originalUrl: absoluteURL,
          attributes: {},
        })
        return; 
      }
      
      // Inline Style Sheet. 
      if (styleSheet.ownerNode && !styleSheet.href) {
        resources.push({
          type: "internal_css_sheet", 
          resourceId: touchedId, 
          cssRules: Array.from((styleSheet as CSSStyleSheet).cssRules).map(x => x.cssText),
        });
        (styleSheet.ownerNode as any).setAttribute("data-archiver-fab-id", touchedId)
        return; 
      }

    } catch (e) {
      console.error(e);
      console.error('Error extracting style sheet resource');
    }
  });



  let imagePromises = Array.from(images, async image => {
    
    let attributes: Record<string, string> = {}
    
    removeAttrib(attributes, image, 'size');
    removeAttrib(attributes, image, 'sizes');
    removeAttrib(attributes, image, 'src-set');
    removeAttrib(attributes, image, 'data-src');
    
    let src = image.getAttribute("src")!;
    let absoluteURL = new URL(src, url).toString();

    let touchedId = (++touchedIdCounter).toString();
    
    image.setAttribute("src", `replaced://${touchedId}`);
    image.setAttribute("data-archiver-fab-id", touchedId);

    resources.push({
      type: absoluteURL.startsWith('datauri') ? "datauri_image" : "external_img",
      resourceId: touchedId,
      originalUrl: absoluteURL,
      attributes
    });

  });

  scripts.forEach(x => x.remove());
  noScripts.forEach(x => x.remove());
  iframes.forEach(x => x.remove());

  await Promise.all([...imagePromises, ...styleSheetPromises]);

  let html = doc.all[0].outerHTML;

  return {
    title: doc.title,
    html: html,
    docType: getDocTypeString(doc),
    resources
  };
}
