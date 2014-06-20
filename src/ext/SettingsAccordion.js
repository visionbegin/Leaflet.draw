var settingsAccordionItemArray = [];

function createSettingsAccordion() {

    // Grab the accordion items from the page
    settingsAccordionItemArray = document.getElementsByClassName('settingsAccordionItem');
    var i = 0;
    // Assign onclick events to the accordion item headings
    for (i = 0; i < settingsAccordionItemArray.length; i++ ) {
        var h2 = getFirstChildWithTagName( settingsAccordionItemArray[i], 'H2' );
        h2.onclick = toggleSettingsAccordionItem;
    }

    // Hide all accordion item bodies except the first
    for (i = 1; i < settingsAccordionItemArray.length; i++ ) {
        settingsAccordionItemArray[i].className = 'settingsAccordionItem hideSection';
    }
}

function toggleSettingsAccordionItem() {
    var itemClass = this.parentNode.className;

    // Hide all items
    for ( var i = 0; i < settingsAccordionItemArray.length; i++ ) {
        settingsAccordionItemArray[i].className = 'settingsAccordionItem hideSection';
    }

    // Show this item if it was previously hidden
    if ( itemClass == 'settingsAccordionItem hideSection' ) {
        this.parentNode.className = 'settingsAccordionItem';
    }
}

function getFirstChildWithTagName( element, tagName ) {
    var node;
    for ( var i = 0; i < element.childNodes.length; i++ ) {
        if ( element.childNodes[i].nodeName == tagName ){
            node = element.childNodes[i];
            break;
        }
    }
    return node
}