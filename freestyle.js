
var freestyle = (function() {
	var ELEMENT_NODE = 1,
		ATTRIBUTE_NODE = 2,
		TEXT_NODE = 3,
		CDATA_SECTION_NODE = 4,
		ENTITY_REFERENCE_NODE = 5,
		ENTITY_NODE = 6,
		PROCESSING_INSTRUCTION_NODE = 7,
		COMMENT_NODE = 8,
		DOCUMENT_NODE = 9,
		DOCUMENT_TYPE_NODE = 10,
		DOCUMENT_FRAGMENT_NODE = 11,
		NOTATION_NODE = 12,

		VAR_PATTERN = /\$\{(.*?)\}/,

		NOOP = function() {};

	var defclass = function(prototipo, extend) {
		var klass = function() {
			this.constructor = arguments.callee
			var initialize = this.initialize
			if (initialize) {
				initialize.apply(this, arguments)
			}
		}
		klass.prototype = prototipo
		if (extend) {
			for (var property in extend) {
				prototipo[property] = extend[property]
			}
		}
		return klass
	}

	var Template = defclass({

		initialize: function(factory, parentNode) {
			this._factory = factory
			this.firstNode = document.createComment("start template")
			this.lastNode = document.createComment("end template")
			this._fragment = parentNode
			this._fragment.appendChild(this.firstNode)
			this._fragment.appendChild(this.lastNode)
			this._listeners = {}
			this.thisObject = {}
			this.elements = []
		},

		addNode: function(node) {
			this._fragment.insertBefore(node, this.lastNode)
			this._processNode(node)
			if (node.nodeType == ELEMENT_NODE) {
				this.elements.push(node)
			}
		},

		addBehavior: function(source) {
			try {
				var behavior = new Function(source);
				behavior.call(this.thisObject, this, this.elements);
			} catch(e) {
				alert(source)
			}
		},

		insert: function(parentNode, refNode, suppressShutdownHook) {
			refNode = refNode || null
			if (this.firstNode.parentNode != this._fragment) {
				this.remove()
			}
			parentNode.insertBefore(this._fragment, refNode)
			//gotta prevent memory leaks.
			if (!suppressShutdownHook) {
				var t = this
				this._shutdownHook = function() {
					if (t.isDomActive()) {
						t.dominactive()
					}
				}

				//TODO: workaround the 'unload' bug in ajs
				if (window.attachEvent) {
					window.attachEvent('unload', this._shutdownHook)
				} else {
					window.addEventListener('unload', this._shutdownHook, false)
				}
			}
			if (domActive(parentNode)) {
				this.domactive()
				return true
			}
		},

		remove: function() {
			var wasDomActive = domActive(this.firstNode)
			for (var current = this.firstNode;;) {
				var node = current
				current = node.nextSibling
				this._fragment.appendChild(node)
				if (node == this.lastNode) {
					break
				}
			}
			if (wasDomActive) {
				this.dominactive()
			}
			if (this._shutdownHook) {
				//TODO: workaround the 'unload' bug in ajs
				if (window.detachEvent) {
					window.detachEvent('unload', this._shutdownHook)
				} else {
					window.removeEventListener('unload', this._shutdownHook, false)
				}
				delete this._shutdownHook
			}
		},

		newInstance: function(model) {
			return this._factory.newInstance(model)
		},

		_processNode: function(node) {
			switch (node.nodeType) {
				case ELEMENT_NODE:
					if (this._handleElement(node)) {
						var children = []
						for (var i = 0; i < node.childNodes.length; i++) children.push(node.childNodes.item(i))
						while (children.length > 0) {
							this._processNode(children.shift())
						}
					}
					break
				case TEXT_NODE:
					this._handleText(node)
					break
				default:
			}
		},

		_handleElement: function(element) {
			var processChildren = true

			if (element.tagName.toUpperCase() == 'SCRIPT' && element.getAttribute('type') == 'text/freestyle') {
				this.addBehavior(element.innerHTML)
				element.parentNode.removeChild(element)
				return false
			}

			for (var i = 0; i < element.attributes.length; i++) {
				var attr = element.attributes[i]
				var match
				if (attr.name == 'foreach') {
					this._addSlotHandler(new Value(this, attr.value), new LoopSlot(this, element))
					processChildren = false
				} else if (attr.name == 'model') {
					var value = new Value(this, attr.value)
					this._addSlotHandler(value, new InputSlot(this, element, value))
				} else if (match = this.VAR_PATTERN.exec(attr.nodeValue)) {
					var before = attr.nodeValue.slice(0, match.index)
					var after = attr.nodeValue.slice(match.index + match[0].length, attr.nodeValue.length)
					this._addSlotHandler(new Value(this,match[1]), new AttributeSlot(attr, before, after))
				}
				if (attr.name == 'name') {
					this.elements[attr.value] = element
				}
			}
			return processChildren
		},

		_handleText: function(node) {
			var parentNode = node.parentNode
			var match = null
			for (var current = node; match = VAR_PATTERN.exec(current.data);) {
				var matchIndex = match.index
				if (matchIndex != 0) {
					current = current.splitText(matchIndex)
				}
				var next = current.splitText(match[0].length)
				this._addSlotHandler(new Value(this, match[1]), new InlineSlot(this, current))
				current = next
			}
			//Mozilla leaves empty text nodes. Remove them for consistency.
			if (current.data == '' && current.parentNode) {
				current.parentNode.removeChild(current);
			}
		},

		_addSlotHandler: function(value, handler) {

			var arrayListener = null

			var write = function(newValue) {
				if (arrayListener) {
					arrayListener.release()
					arrayListener = null
				}
				var objects = newValue
				if (!newValue || newValue.constructor != Array) {
					objects = [newValue]
				} else {
					arrayListener = freestyle.properties.addArrayListener(objects, function(start, howMany, newObjects) {
						handler.splice(start, howMany, newObjects)
					})
				}
				handler.splice(0, handler.size(), objects)
			}
			value.onset(write)
			value.ondeactivate(function() {
				if (arrayListener) {
					arrayListener.release()
				}
			})
		}
	})

	var InlineSlot = defclass({
		initialize: function(template, node) {
			this._template = template
			var parentNode = node.parentNode
			this._start = document.createComment('begin inline slot')
			this._end = document.createComment('end inline slot')
			parentNode.insertBefore(this._end, node)
			parentNode.insertBefore(this._start, this._end)
			parentNode.removeChild(node)
			this._subviews = []
		},
	
		splice: function(start, howMany, newObjects) {
			var parentNode = this._start.parentNode
			var olds = this._subviews.splice(start, howMany)
			var refNode
			for (var i = 0; i < olds.length; i++) {
				var old = olds[i]
				refNode = old.lastNode.nextSibling
				old.remove()
			}
			refNode = refNode || this._end
			var views = []
			for (var i = 0; i < newObjects.length; i++) {
				var object = newObjects[i]
				var view = null
				if (object && object.getView) {
					view = new TemplateConnector(this._template, object.getView())
				} else if (object && object.constructor == Template) {
					view = new TemplateConnector(this._template, object)
				} else {
					var node = document.createTextNode(new String(object))
					view = {
						lastNode: node,
						insert: function(parentNode, refNode) {
							parentNode.insertBefore(node, refNode)
						},
						remove: function() {
							node.parentNode.removeChild(node)
						}
					}
				}
				view.insert(parentNode, refNode, true)
				views.push(view)
			}
			this._subviews.splice.apply(this._subviews, [start, 0].concat(views))
		},
	
		size: function() {
			return this._subviews.length
		}
})

	var AttributeSlot = defclass({
		initialize: function(attr, before, after, expression) {
			this._attr = attr
			this._before = before
			this._after = after
			this._objects = []
		},

		splice: function(start, howMany, newObjects) {
			this._objects.splice.apply(this._objects, [start, howMany].concat(newObjects))
			this._attr.value = this._before + this._objects.join(" ") + this._after
		},

		size: function() {
			return this._objects.length
		}
	})

	var LoopSlot = defclass({
		initialize: function(parent, element) {
			childNodes = element.childNodes
			this._template = freestyle.template({
				nodes: element.childNodes
			})
			while (element.firstChild) {
				element.removeChild(element.firstChild)
			}
			this._views = []
			this._element = element
			this._parent = parent
		},

		splice: function(start, howMany, newObjects) {
			var refNode = this._views[start] ? this._views[start].firstNode : null

			var views = []
			for (var i = 0; i < newObjects.length; i++) {
				var view = new TemplateConnector(this._parent, this._template.newInstance({
					item: newObjects[i],
					index: start + i,
					count: start + i + 1
				}))

				view.insert(this._element, refNode, true)
				views.push(view)
			}
			var olds = this._views.splice.apply(this._views, [start, howMany].concat(views))
			for (var i = 0; i < olds.length; i++) {
				olds[i].detach()
				olds[i].remove()
			}
			//update the index properties to reflect, their new offsets
			for (var i = (start + newObjects.length); i < this._views.length; i++) {
				freestyle.properties.set(this._views[i].model, 'index', i)
				freestyle.properties.set(this._views[i].model, 'count', i + 1)
			}
		},

		size: function() {
			return this._views.length
		}
	})

	var InputSlot = defclass({
		initialize: function(template, element, value) {
			this._element = element
			this._objects = []

			var sync = function() {
				value.set(element.value)
			}

			template.events.onkeyup(element, sync)
			template.events.onblur(element, sync)
		},
	
		splice: function(start, howMany, newObjects) {
			var old = this._objects.splice.apply(this._objects, [start, howMany].concat(newObjects))
			this._element.value = this._objects.join(" ")
		},

		size: function() {
			return this._objects.length
		}
	})
})()