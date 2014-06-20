L.EditToolbar.Edit = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		// Set options to the default unless already set
		this._selectedPathOptions = options.selectedPathOptions;

		// Store the selectable layer group for ease of access
		this._featureGroup = options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditToolbar.Edit.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', {handler: this.type});
			//this disable other handlers

		this._map.fire('draw:editstart', { handler: this.type });
			//allow drawLayer to be updated before beginning edition.

		L.Handler.prototype.enable.call(this);
		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);
	},

	disable: function () {
		if (!this._enabled) { return; }
		this._featureGroup
			.off('layeradd', this._enableLayerEdit, this)
			.off('layerremove', this._disableLayerEdit, this);
		L.Handler.prototype.disable.call(this);
		this._map.fire('draw:editstop', { handler: this.type });
		this.fire('disabled', {handler: this.type});
		$('.leaflet-draw-edit-styleable').spectrum("hide"); // show style controls to let user know of possible changes

        $('#dialog-div').hide();
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Tooltip(this._map);
			this._tooltip.updateContent({
				text: L.drawLocal.edit.handlers.edit.tooltip.text,
				subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
			});

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('touchmove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map
				.off('mousemove', this._onMouseMove, this)
				.off('touchmove', this._onMouseMove, this);

            $('#dialog-div').hide();
		}
	},

	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {

			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire('draw:edited', {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else if (layer instanceof L.Marker) { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;
		layer.styled = false;
		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			} else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			} else if (layer instanceof L.Marker) { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}
		}
	},

	_toggleMarkerHighlight: function (marker) {
		if (!marker._icon) {
			return;
		}
		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		var icon = marker._icon;

		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-editable')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-editable');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-editable');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	},

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			isMarker = layer instanceof L.Marker,
			pathOptions;
		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leafler.markercluster there
		// is a chance that a marker doesn't.
		if (isMarker && !layer._icon) {
			return;
		}

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		// Update layer style so appears editable
		if (this._selectedPathOptions) {
			pathOptions = L.Util.extend({}, this._selectedPathOptions);

			// Use the existing color of the layer
			if (pathOptions.maintainColor) {
				pathOptions.color = layer.options.color;
				pathOptions.fillColor = layer.options.fillColor;
			}

			if (isMarker) {
				layer.options.previousOptions = L.Util.extend({color: layer.options.color, fontSize: layer.options.fontSize});
				this._toggleMarkerHighlight(layer);
			} else {
				layer.options.previousOptions = L.Util.extend({ dashArray: null }, layer.options);

				// Make sure that Polylines are not filled
				if (!(layer instanceof L.Circle) && !(layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
					pathOptions.fill = false;
				}
				
				//layer.setStyle(pathOptions); //uncomment to revert to edit styles
			}
		}

		if (isMarker) {
			layer.dragging.enable();
			layer
				.on('dragend', this._onMarkerDragEnd)
				// #TODO: remove when leaflet finally fixes their draggable so it's touch friendly again.
				.on('touchmove', this._onTouchMove, this)
				.on('touchend', this._onMarkerDragEnd, this);

			layer.on('click', this._editText ,this); // enable text edit
		} else {
			layer.editing.enable();
		}
		layer.on('click', this._editStyle, this); // on click show styles in style controls
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;

		// Reset layer styles to that of before select
		if (this._selectedPathOptions) {
			if (layer instanceof L.Marker) {
				//this._toggleMarkerHighlight(layer);
				layer._icon.classList.remove('leaflet-edit-marker-selected');
				layer._icon.classList.remove('leaflet-edit-marker-editable');

				if (!layer.styled) {
					layer._icon.style.color = layer.options.color = layer.options.previousOptions.color;
					layer._icon.style.fontSize = layer.options.fontSize = layer.options.previousOptions.fontSize;
				}
			} else {
				if (layer.edited) {
					return;
				} else {
					if(!layer.styled) {
						// reset the layer style to what is was before being selected
						layer.setStyle(layer.options.previousOptions);
					}
				}
				// remove the cached options for the layer object
				delete layer.options.previousOptions;
				layer.setStyle({ dashArray: '' });
				layer.edited = false;
				layer.styled = false;
				L.previousLayer = null;
			}
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer
				.off('dragend', this._onMarkerDragEnd, this)
				.off('touchmove', this._onTouchMove, this)
				.off('touchend', this._onMarkerDragEnd, this);
		} else {
			layer.editing.disable();
		}

		layer.off('click', this._editStyle, this);
	},

	_onMarkerDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_onTouchMove: function (e){
		var touchEvent = e.originalEvent.changedTouches[0],
			layerPoint = this._map.mouseEventToLayerPoint(touchEvent),
			latlng = this._map.layerPointToLatLng(layerPoint);
		e.target.setLatLng(latlng);
	},

	_editStyle: function (e) {
		var layer = e.layer || e.target || e;
		
		// unselect previous item
		if (L.previousLayer != null) {
			if (L.previousLayer instanceof L.Marker) {
				L.previousLayer._icon.classList.remove('leaflet-edit-marker-selected');
				L.previousLayer._icon.classList.add('leaflet-edit-marker-editable');
			} else {
				L.previousLayer.setStyle({ dashArray: '' });
			}
		}

		if (layer instanceof L.Marker) {
			L.previousLayer = layer;

			// select marker
			layer._icon.classList.remove('leaflet-edit-marker-editable');
			layer._icon.classList.add('leaflet-edit-marker-selected');

			// #TODO: don't use jquery
			$('.leaflet-draw-edit-styleable').spectrum("set", layer._icon.style.color); // set color from selected object
			$('.text-controls select').val(layer._icon.style.fontSize.replace('px','')); // set font size from selected object
			$('.leaflet-draw-edit-styleable').spectrum("show");	// show style controls to let user know of possible changes

			return;
		}

		L.previousLayer = layer; // set previous item
		
		// #TODO: don't use jquery
		layer.setStyle({ dashArray: '10, 10' }); // select item
		$('#flat').spectrum("set", layer.options.color); // set color from selected object
		$('#dialog-stroke').val(layer.options.weight); // set stroke size from selected object
		//$('.leaflet-draw-edit-styleable').spectrum("show"); // show style controls to let user know of possible changes

        $('#dialog-div').show();

		// layer.options.color
		// layer.options.opacity
		// layer.options.weight
	},
	
	_editText: function (e) {


		var layer = e.layer || e.target || e;
        if (!(layer instanceof L.Marker)) {
            layer._icon.firstChild.contentEditable = true;
            layer._icon.click(); // simulate a double click to enable text editing
        }


        $('#dialog-div').show();
	},

	_hasAvailableLayers: function () {
		return this._featureGroup.getLayers().length !== 0;
	}
});
