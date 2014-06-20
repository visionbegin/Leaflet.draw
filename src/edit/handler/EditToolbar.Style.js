// Styleable is depended on Jquery and Spectrum.js
// Spectrum was picked for the community support and features with pallets, alpha, touch and multi instance
// This is included for demo only. You should grab the latest version
// of it here: https://github.com/bgrins/spectrum
// Specrum is dependent on jquery but that's cool :P

L.EditToolbar.Styleable = L.Handler.extend({
	statics: {
		TYPE: 'styleable'
	},

	includes: L.Mixin.Events,

    imageURL: "",

	initialize: function (map, options) {
		this._styleable = this; // cache this to target in jquery

		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		this._map = map;

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Styleable.TYPE;

		this._setColor('#fe57a1', '0.2'); // Set color for all tools on load
		this._createControls(); // Create style controls
	},

	enable: function () {
	},

	disable: function () {
	},

	addHooks: function () {
		//this.fire('enable');
	},

	removeHooks: function () {
	},

	_createControls: function () {

        //Create the dialog template

        this._createDialogTemplate();

        var that = this;

        var selectFontSize = document.getElementById('dialog-font');
        selectFontSize.addEventListener('change', function() {
            that._setFontSize(this.value);
        });

        var selectStroke = document.getElementById('dialog-stroke');
        selectStroke.addEventListener('change', function() {
            that._setStroke(this.value);
        });

        var measurementSystem = document.getElementById('measurementSystem');
        measurementSystem.addEventListener('change', function() {
            that._setMeasurementSystem(this.value);
        });

        var linkRemove = document.getElementById('linkRemove');
        linkRemove.addEventListener('click', function(){
            if (L.previousLayer != null) {
                L.previousLayer.closePopup();
                L.previousLayer.unbindPopup();
                L.previousLayer.edited = true;
                L.previousLayer.styled = true;
            }
        });

        var linkApply = document.getElementById('linkApply');
        linkApply.addEventListener('click', function () {
            if (L.previousLayer != null) {
                var title = document.getElementById('title').value.trim();
                var imageurl = document.getElementById('imageurl').value.trim();
                var description = document.getElementById('description').value.trim();
                var linkurl = document.getElementById('linkurl').value.trim();
                var linkurltext = document.getElementById('linkurltext').value.trim();
                console.log("title: " + title + " imageurl: " + imageurl + " description: " + description + " linkurl: " + linkurl + " linkurltext: " + linkurltext);

                var divNode = document.createElement('DIV');
                divNode.setAttribute("style", "max-width:250px;");

                var pophtml = "";
                if (title != "") {
                    pophtml += "<h2>" + title + "</h2>";
                }
                if (imageurl != "") {
                    pophtml += '<div style="margin:4px 0"><img style="width:100%;height: auto" src="' + imageurl + '" alt="" /> </div>';
                }
                if (description != "") {
                    pophtml += '<div style="margin:4px 0">' + description + '</div>';
                }
                if (linkurl != "" && linkurltext != "") {
                    pophtml += '<div style="margin:4px 0"><a target="_blank" href="' + linkurl + '">' + linkurltext + '</a></div>';
                }


                divNode.innerHTML = pophtml;


                L.previousLayer.bindPopup(divNode);
                L.previousLayer.edited = true;
                L.previousLayer.styled = true;
                L.previousLayer.openPopup();
            }
        });

        this._setStroke(4);
        this._setFontSize(12);
        selectStroke.value = 4;
        selectFontSize.value = 12;


        window.onload = function(){



            $("#flat").spectrum({
                flat: false,
                showInput: false,
                color: 'rgba(254,87,161,0.2)', //Hot pink all the things!
                showAlpha: true,
                showPalette: true,
                palette: [ ],
                allowEmpty:true,
                showButtons: false,
                move: function(color) {
                    that._setColor(color.toHexString(), color.alpha);
                }
            });

            createSettingsAccordion();


		};
	},

    _setMeasurementSystem: function(system){

        if (L.previousLayer != null && L.previousLayer instanceof L.Polyline) {
            var color = L.previousLayer.options.color;
            L.previousLayer.setText(null);
            L.previousLayer.setText(L.previousLayer.getLengthString(system, "dynamic"), {repeat: false,
                center: true,
                offset: -8,
                attributes: {'font-weight': 'bold',
                    'fill': color,
                    'font-size': '12'}});

            L.previousLayer.edited = true;
            L.previousLayer.styled = true;

        }

    },



	_setFontSize: function (size) {
        //alert("_setFontSize");
		// Edit selected item in edit mode
		if (L.previousLayer != null ) {
			if (L.previousLayer instanceof L.Marker) {
				L.previousLayer._icon.style.fontSize = L.previousLayer.options.fontSize = size + 'px';
			} else {
				// #TODO: change opacity if it is just the polyline
				L.previousLayer.setStyle({
					fontSize: size
				});
			}
			L.previousLayer.edited = true;
			L.previousLayer.styled = true;
		}

		// Use global var of toolbar that gets set on L.Control.Draw initialization
		L.toolbarDraw.setDrawingOptions({
			textlabel: { fontSize: size + 'px' }
		});
	},

	_setColor: function (color, opacity) {
        //alert("_setColor");
		// Edit selected item in edit mode
		if (L.previousLayer != null ) {
			if (L.previousLayer instanceof L.Marker) {
				L.previousLayer._icon.style.color = L.previousLayer.options.color = color;
			} else {
				// #TODO: change opacity if it is just the polyline
				L.previousLayer.setStyle({
					color: color,
					fillOpacity: opacity
				});
			}

			L.previousLayer.edited = true;
			L.previousLayer.styled = true; // #TODO: simplyfy this to use .edited
		}

		// Use global var of toolbar that gets set on L.Control.Draw initialization
		L.toolbarDraw.setDrawingOptions({
			polyline: { shapeOptions: { color: color, opacity: opacity } },
			polygon: { shapeOptions: { color: color, fillOpacity: opacity } },
			rectangle: { shapeOptions: { color: color, fillOpacity: opacity } },
			circle: { shapeOptions: { color: color, fillOpacity: opacity } },
			textlabel: { color: color }
		});
	},

	_setStroke: function (weight) {
        if(L.previousLayer instanceof L.Marker){
            return;
        }
		// Edit selected item in edit mode
		if (L.previousLayer != null ) {
			L.previousLayer.setStyle({
				weight: weight
			});
			L.previousLayer.edited = true;
			L.previousLayer.styled = true; // #TODO: simplyfy this to use .edited
		}

		// Use global var of toolbar that gets set on L.Control.Draw initialization
		L.toolbarDraw.setDrawingOptions({
			polyline: { shapeOptions: { weight: weight } },
			polygon: { shapeOptions: { weight: weight } },
			rectangle: { shapeOptions: { weight: weight } },
			circle: { shapeOptions: { weight: weight } }
		});
	},

    _createDialogTemplate: function () {
        var template = '<div id="moveSettingDialogHandle" class="moveSettings" >Move</div> ' +
            '<div class="closeSettings" onclick="$(\'#dialog-div\').hide()">X</div> ' +
            '<div style="clear: both"></div> ' +
            '<div id="settingsAccordion">' +
            '<div class="settingsAccordionItem">' +
                '<h2>Color</h2>' +
                '<div class="dialog-frm">' +
                    '<h1>Color Settings<span>Please select the color for the item.</span></h1>' +
                    '<label>' +
                    '<input type="text" id="flat" />' +
                    '</label>' +
                '</div>' +
            '</div>' +
            '<div class="settingsAccordionItem">' +
                '<h2>Font and Stroke</h2>' +
                '<div class="dialog-frm">' +
                    '<h1>Font and Stroke Settings<span>Please fill fields desired, then click apply.</span></h1>' +
                    '<label>' +
                    '<span>Stroke Width :</span>' +
                    '<select id="dialog-stroke"><option class="size-1" value="1">1</option><option class="size-2" value="2">2</option><option class="size-3" value="3">3</option><option class="size-4" value="4">4</option><option class="size-5" value="5">5</option><option class="size-6" value="6">6</option><option class="size-7" value="7">7</option><option class="size-8" value="8">8</option><option class="size-9" value="9">9</option><option class="size-10" value="10">10</option><option class="size-11" value="11">11</option><option class="size-12" value="12">12</option><option class="size-13" value="13">13</option><option class="size-14" value="14">14</option><option class="size-15" value="15">15</option><option class="size-16" value="16">16</option><option class="size-17" value="17">17</option><option class="size-18" value="18">18</option><option class="size-19" value="19">19</option><option class="size-20" value="20">20</option></select>' +
                    '</label>' +
                    '<label>' +
                    '<span>Font Size :</span>' +
                    '<select id="dialog-font"><option class="size-1" value="1">1</option><option class="size-2" value="2">2</option><option class="size-3" value="3">3</option><option class="size-4" value="4">4</option><option class="size-5" value="5">5</option><option class="size-6" value="6">6</option><option class="size-7" value="7">7</option><option class="size-8" value="8">8</option><option class="size-9" value="9">9</option><option class="size-10" value="10">10</option><option class="size-11" value="11">11</option><option class="size-12" value="12">12</option><option class="size-13" value="13">13</option><option class="size-14" value="14">14</option><option class="size-15" value="15">15</option><option class="size-16" value="16">16</option><option class="size-17" value="17">17</option><option class="size-18" value="18">18</option><option class="size-19" value="19">19</option><option class="size-20" value="20">20</option><option class="size-21" value="21">21</option><option class="size-22" value="22">22</option><option class="size-23" value="23">23</option><option class="size-24" value="24">24</option><option class="size-25" value="25">25</option><option class="size-26" value="26">26</option><option class="size-27" value="27">27</option><option class="size-28" value="28">28</option><option class="size-29" value="29">29</option><option class="size-30" value="30">30</option><option class="size-31" value="31">31</option><option class="size-32" value="32">32</option><option class="size-33" value="33">33</option><option class="size-34" value="34">34</option><option class="size-35" value="35">35</option><option class="size-36" value="36">36</option><option class="size-37" value="37">37</option><option class="size-38" value="38">38</option><option class="size-39" value="39">39</option><option class="size-40" value="40">40</option><option class="size-41" value="41">41</option><option class="size-42" value="42">42</option><option class="size-43" value="43">43</option><option class="size-44" value="44">44</option><option class="size-45" value="45">45</option><option class="size-46" value="46">46</option><option class="size-47" value="47">47</option><option class="size-48" value="48">48</option><option class="size-49" value="49">49</option><option class="size-50" value="50">50</option></select>' +
                    '</label>' +
                '</div>' +
            '</div>' +
            '<div class="settingsAccordionItem">' +
                '<h2>Link</h2>' +
                '<div class="dialog-frm">' +
                    '<h1>Link Settings<span>Please fill fields desired, then click apply.</span></h1>' +
                    '<label>' +
                        '<span>Title :</span>' +
                        '<input id="title" type="text" name="title" placeholder="Title" />' +
                    '</label>' +
                    '<label>' +
                        '<span>Image Url :</span>' +
                    '<input id="imageurl" type="text" name="imageurl" placeholder="Enter a valid url to an image" />' +
                    '</label>' +
                    '<label>' +
                    '<span>Description :</span>' +
                    '<textarea rows="5" id="description" name="message" placeholder="Description"></textarea>' +
                    '</label>' +
                    '<label>' +
                    '<span>Link Url :</span>' +
                    '<input id="linkurl" type="text" name="linkurl" placeholder="Enter a valid url to an image" />' +
                    '</label>' +
                    '<label>' +
                    '<span>Link Url Text :</span>' +
                    '<textarea rows="5" id="linkurltext" name="linkurltext" placeholder="Enter display text for the link"></textarea>' +
                    '</label>' +

                    '<input id="linkApply" type="button" class="button" value="Apply" />' +
                    '<div style="display:inline-block;padding-right: 4px"></div> ' +
                    '<input id="linkRemove" type="button" class="button" value="Delete" />' +
                    '<div style="padding-bottom: 10px"></div>' +
                '</div>' +
            '</div>' +
            '<div class="settingsAccordionItem">' +
                '<h2 class="last-item">Measurement</h2>' +
                '<div class="dialog-frm">' +
                '<h1>Measurement Settings<span>Please choose your measurement display preferences for polylines.</span></h1>' +
                '<label>' +
                '<span>Title :</span>' +
                    '<select id="measurementSystem" name="measurementSystem">' +
                        '<option value="english" selected="selected">English</option>' +
                        '<option value="metric" selected="selected">Metric</option>' +
                        '<option value="both" selected="selected">Both</option>' +
                    '</select>' +
                '</label>' +
                '</div>' +
            '</div>' +
        '</div>';


        if(document.getElementById("dialog-div") == null){
            //var mainDialogDiv = '<div id="dialog-div" style="display:none;" class="grey-dialog-block"></div>';
            var mainDialogDiv = document.createElement("DIV");
            mainDialogDiv.setAttribute('id', 'dialog-div');
            mainDialogDiv.setAttribute('style', 'display:none;');
            mainDialogDiv.setAttribute('class', 'grey-dialog-block'); //draggable="true"
            //mainDialogDiv.setAttribute('draggable', 'true');
            document.body.appendChild(mainDialogDiv);
            //$(document.body).append(mainDialogDiv);
        }

        document.getElementById("dialog-div").innerHTML = "";
        document.getElementById("dialog-div").innerHTML = template;

        //Make it draggable
        var elementToDrag = document.getElementById('dialog-div');
        draggable(elementToDrag, document.getElementById('moveSettingDialogHandle'));
        //draggable(elementToDrag);
    }
});