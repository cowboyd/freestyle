var freestyle = {require: function() {}}

/* -------------- BEGIN js/atomic-0.1/atomic/dom.js ------------- */ 
if (!this.atomic) { var atomic = {} }

/*
	Object: atomic.dom
	Contains utility functions for interacting with browser DOM objects.
*/
if (!this.atomic.dom) { 
	atomic.dom = {
		/*
		 * Variable: atomic.dom.ELEMENT_NODE
		 * 
		 * nodeType of Element nodes
		 */
		ELEMENT_NODE: 1,
		
		/*
		 * Variable: atomic.dom.ATTRIBUTE_NODE
		 * 
		 * nodeType of Attribute nodes.
		 */	
		ATTRIBUTE_NODE: 2,
		/*
		 * Variable: atomic.dom.TEXT_NODE
		 * 
		 * nodeType of Text nodes.
		 */	
		
		TEXT_NODE: 3,
		/*
		 * Variable: atomic.dom.CDATA_SECTION_NODE
		 * 
		 * nodeType of character data nodes.
		 */	
		CDATA_SECTION_NODE: 4,
		
		/*
		 * Variable: atomic.dom.ENTITY_REFERENCE_NODE
		 * 
		 * nodeType of entity reference nodes.
		 */			
		ENTITY_REFERENCE_NODE: 5,

		/*
		 * Variable: atomic.dom.ENTITY_NODE
		 * 
		 * nodeType of character entity nodes.
		 */			
		ENTITY_NODE: 6,

		/*
		 * Variable: atomic.dom.PROCESSING_INSTRUCTION_NODE
		 * 
		 * nodeType of processing instruction nodes.
		 */			
		PROCESSING_INSTRUCTION_NODE: 7,

		/*
		 * Variable: atomic.dom.COMMENT_NODE
		 * 
		 * nodeType of comment nodes.
		 */	
		COMMENT_NODE: 8,

		/*
		 * Variable: atomic.dom.DOCUMENT_NODE
		 * 
		 * nodeType of the document node.
		 */	
		DOCUMENT_NODE: 9,

		/*
		 * Variable: atomic.dom.DOCUMENT_TYPE_NODE
		 * 
		 * nodeType of document type nodes.
		 */	
		DOCUMENT_TYPE_NODE: 10,

		/*
		 * Variable: atomic.dom.DOCUMENT_FRAGMENT_NODE
		 * 
		 * nodeType of document fragment nodes.
		 */	
		DOCUMENT_FRAGMENT_NODE: 11,

		/*
		 * Variable: atomic.dom.NOTATION_NODE
		 * 
		 * nodeType of notation nodes.
		 */	
		NOTATION_NODE: 12
		
	}
}
	/*
		Variable: atomic.dom.TRIM_REGEX

		A regular expression for trimming spaces from the start and end of a string.
	*/
	atomic.dom.TRIM_REGEX = /^\s*|\s*$/g,

	/*
		Function: atomic.dom.classRegex

	 	Creates and returns a regular expression that will match a string that contains 'className'.

		Parameters:
			className - the className to match

		Returns:
			a regular expression
	*/
	atomic.dom.classRegex = function(className) {
		return new RegExp("(\\s|^)" + className + "(\\s|$)");
	}

	/*
		Function: atomic.dom.hasClass

	 	Checks whether an element has a class.

		Parameters:
			element - the element
			className - the class name to find

		Returns:
			true if the element has the class
	*/
	atomic.dom.hasClass = function(element, className) {
		if (!element || typeof element.className == 'undefined' ) {
			return false;
		}
		var reg = atomic.dom.classRegex(className);
		return element.className.match(reg);
	}

	/*
		Function: atomic.dom.addClass

		Adds a class to an element if it does not already have it.

		Parameters:
 			element - the element to get the class
			className - the class to apply to the element
	*/
	atomic.dom.addClass = function(element, className) {
		if (element && typeof element.className != 'undefined' && !atomic.dom.hasClass(element, className)) {
			if (element.className) {
				element.className = element.className + ' ' + className;
			} else {
				element.className = className;
			}
		}
	}

	/*
		Function: atomic.dom.removeClass

		Removes a class from an element.

	 	Parameters:
			element - the element to remove the class from
			className - the name of the class to remove
	*/
	atomic.dom.removeClass = function(element, className) {
		if (element && typeof element.className != 'undefined' && atomic.dom.hasClass(element, className)) {
			var reg = atomic.dom.classRegex(className);
			var newClasses = element.className.replace(reg, ' ');
			newClasses = newClasses.replace(atomic.dom.TRIM_REGEX, "");
			element.className = newClasses;
		}
	}

/* -------------- END js/atomic-0.1/atomic/dom.js------------- */

/* -------------- BEGIN js/atomic-0.1/atomic/event.js ------------- */ 
if (!this.atomic) { var atomic = {} }

/*
	Object: atomic.event
	Contains utility functions for dealing with events.
*/
if (!this.atomic.event) { atomic.event = {}; }

	/*
		Variable: atomic.event.NOOP

		A function that does nothing. After an event callback binding is released,
		the release function is replaced with NOOP, so that the original release
		function can be garbage collected.
	*/
	atomic.event.NOOP = function() {}

	/*
		Function: atomic.event.attach

		Attaches a callback function that will be executed when an event occurs.
		The DOM event object will be passed as a parameter to the callback
		function. The 'this' variable in the callback function will be a reference
		to the element. Any event extensions will be applied to the event before the
		callback is executed.

		This function returns an event binding object with a release() function.
		Calling the release function will remove the callback and it will no longer
		be triggered by events.

		Parameters:
			element - the DOM element on which the event will occur
			type - the type of event that will trigger the callback (ex. 'click', 'keypress')
			callback - the function that will be executed when the event occurs

		Returns:
			the event binding
		See: <extendEvent>
	*/
	atomic.event.attach = function(element, type, callback) {
		var binding = {};
		if (element.addEventListener) {
			var caller = function(event) {
				atomic.event._private.extendEvent(event, element);
				callback.call(element, event);
			}
			element.addEventListener(type, caller, false);
			binding.release = function() {
				element.removeEventListener(type, caller, false);
				this.release = atomic.event.NOOP;
			}
		} else if (element.attachEvent) {
			var caller = function() {
				var event = window.event;
				atomic.event._private.extendEvent(event, element);
				callback.call(element, event);
			}
			element.attachEvent("on" + type, caller);
			binding.release = function() {
				element.detachEvent("on" + type, caller);
				this.release = atomic.event.NOOP;
			};
		} else {
			
		}
		return binding;
	}

	/*
		Function: atomic.event.extendEvent

		Adds a function that is called in order to extend the event object before it
		is passed to a callback function. The extender function should accept the event
		as the first parameter. This is a reference to the element when the function is
		executed.

		Example:
		:	//Ensures that the target property is set on the event.
		:	atomic.event.extendEvent(function(event) {
		:		if (!event.target) { event.target = this; }
		:	});

		Parameters:
			extender - the extender function
	*/
	atomic.event.extendEvent = function(extender) {
		if (typeof extender == 'function') {
			this._private.extenders.push(extender);
		}
	}

	/*
		Function: atomic.event.fixTarget

		An event extender that ensures that the target property has been set on
		the event.

		Parameters:
			event - the event

		Usage:
		:	atomic.event.extendEvent(atomic.event.fixTarget)
	*/
	atomic.event.fixTarget = function(event) {
		if (!event.target && event.srcElement) {
			event.target = event.srcElement;
		}
	}

	/*
		Function: atomic.event.fixPageCoordinates

		An event extender that ensures that the page coordinates are set properly.

		Parameters:
			event - the event

		Usage:
		:	atomic.event.extendEvent(atomic.event.fixPageCoordinates)
	*/
	atomic.event.fixPageCoordinates = function(event) {
		if (typeof event.pageX == 'undefined') {
			event.pageX = event.x + document.body.scrollLeft;
			event.pageY = event.y + document.body.scrollTop;
		}
	}

	/*
		Function: atomic.event.fixPreventDefault

		An event extender that adds the preventDefault function for IE.

		Parameters:
			event - the event

		Usage:
		:	atomic.event.extendEvent(atomic.event.fixPreventDefault)
	*/
	atomic.event.fixPreventDefault = function(event) {
		if (!event.preventDefault) {
			event.preventDefault = atomic.event._private.preventDefault;
		}
	}

	/*
		Function: atomic.event.fixStopPropagation

		An event extender that adds the stopPropagation function for IE.

		Parameters:
			event - the event

		Usage:
		:	atomic.event.extendEvent(atomic.event.fixStopPropagation)
	*/
	atomic.event.fixStopPropagation = function(event) {
		if (!event.stopPropagation) {
			event.stopPropagation = atomic.event._private.stopPropagation;
		}
	}

	atomic.event._private = {
		preventDefault: function () {
			this.returnValue = false;
		},

		stopPropagation: function () {
			this.cancelBubble = true;
		},

		extenders: [],

		extendEvent: function(event, element) {
			for (var i = 0; i < this.extenders.length; i++) {
				var extender = this.extenders[i];
				extender.call(element, event);
			}
		}
	}

/* -------------- END js/atomic-0.1/atomic/event.js------------- */

/* -------------- BEGIN js/src/class.js ------------- */ 

function defineClass(prototipo, extend) {	
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

/* -------------- END js/src/class.js------------- */

/* -------------- BEGIN js/src/properties.js ------------- */ 

freestyle.require(
	'class.js'
)

/**
 * SYNOPSIS:
 * <pre>
 * var o = new Object()
 * property = phatweb.properties.getPropertyObject(o, "foo")
 * property.addChangeListener(function(prop) {
 *    alert('new value: ' + prop.get())
 * })
 * //you can use the static set method, or the property object itself
 * phatweb.properties.set(o, 'foo', 'bar') // alert 'new value: bar'
 * property.set(o, 'foo', 'baz') //alert 'new value: baz'
 * </pre>
 * Properties are just like normal javascript properties except that you can 
 * listen to changes to the property in a xplatform way. It isn't quite as nice
 * as native property listening, but since that isn't supported in IE, we have
 * to do it this way. As a result, it requires the observance of some rules
 * 
 */
freestyle.properties = {
}

/**
 * The property object is like a little "controller" for the for the property
 * it is through this object that you can get,set, and listen for changes
 * to a property.
 */
freestyle.properties.Property = defineClass({
	
	/**
	 * creates a new property object representing the property on <code>object</code> with the name 
	 * <code>name</code>
	 */
	initialize: function(object, name) {
		this.object = object
		this.name = name
		this._changeListeners = []
		this._activationListeners = []
		this.set(object[name], true)
	},
	
	/**
	 * retrieves the value of the property
	 */
	get: function() {
		return this.object[this.name]
	},
	
	/**
	 * sets the value of the property to <code>value</code>
	 * what's happening here is that you're actually putting the 
	 * property object onto the value, which is weird. not sure if I like this
	 * 
	 */
	set: function(value) {
		var object = this.object
		var name = this.name
		var current = object[name]
		
		if (current == value) return
		
		if (typeof value == 'undefined') {
			delete object[name]
		}
		object[name] = value
		var callbacks = this._changeListeners
		for (var i = 0; i < callbacks.length; i++) {
			callbacks[i].call(this, this)
		}
		callbacks = object.__properties_change_listeners__
		if (callbacks) {
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i](object, name, value)
			}
		}
	},
	
	/**
	 * calls the function <code>listener</code> whenever the value of this property changes
	 * returns a binding object which can be used to remove the listener
	 */
	addChangeListener: function(listener) {
		var callbacks = this._changeListeners
		callbacks.push(listener)
		return {
			release: function() {
				for (var i = 0; i < callbacks.length; i++) {
					if (callbacks[i] == listener) {
						callbacks.splice(i,1)
						break
					}
				}
			}
		}
	}
})

freestyle.properties.set = function(object, name, value) {
	freestyle.properties.getPropertyObject(object, name).set(value)
}

freestyle.properties.splice = function(array, start, howMany, newObjects) {
	if (!array || (array.constructor != Array)) throw new Error('splice() ' + array + ' is not an Array')
	array.splice.apply(array, [start, howMany].concat(newObjects))
	var listeners = array.__fs_array_listeners__ || []
	for (var i = 0; i < listeners.length; i++) {
		listeners[i].call(array, start, howMany, newObjects)
	}
}

freestyle.properties.addArrayListener = function(array, listener) {
	var listeners = array.__fs_array_listeners__ = array.__fs_array_listeners__ || []
	listeners.push(listener)
	return {release: function() {
		for (var i = 0; i < listeners.length; i++) {
			if (listeners[i] == listener) {
				listeners.splice(i,1)
			}
		}
	}}
}

freestyle.properties.addChangeListener = function(object, property, callback) {
	return freestyle.properties.getPropertyObject(object, property).addChangeListener(callback)
}

freestyle.properties.getPropertyObject = function(object, name) {
	var properties = object.__properties__ = object.__properties__ || {}
	var property = properties[name]
	if (!property) {
		property = new freestyle.properties.Property(object, name)
		object.__properties__[name] = property
	}
	return property
}

freestyle.properties.addAnyPropertyChangeListener = function(object, callback) {
	var listeners = object.__properties_change_listeners__ = object.__properties_change_listeners__ || []
	listeners.push(callback)
	return {
		release: function() {
			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i] == callback) {
					listeners.splice(i,1)
				}
			}
		}
	}
}

freestyle.set = freestyle.properties.set
freestyle.splice = freestyle.properties.splice
freestyle.push = function(array) {
	for (var i = 1, args = []; i < arguments.length; i++) args.push(arguments[i])
	freestyle.splice(array, array.length, 0, args)
}
/* -------------- END js/src/properties.js------------- */

/* -------------- BEGIN js/src/template.js ------------- */ 

//TODO LIST
// make sure properties get torn down correctly

freestyle.require(
	'atomic/dom.js',
	'atomic/event.js',
	'class.js',
	'properties.js'
)


freestyle.template = (function() {
	
atomic.event.extendEvent(atomic.event.fixTarget)

//checks to see if a node is connected to the document element
var domActive = function(node) {
	for (; node; node = node.parentNode) {
		if (node == document) return true
	}
}


/*defines a method on a class, and also a method to register 
 *callbacks which are invoked whenever that method is called.
 * e.g.
 * defineCallbackMethod(Foo, 'bar')
 * var f = new Foo()
 * f.onbar(function(one, two) {
 *    alert(one + ' ' + two + "!")
 * })
 * f.bar('Hello', 'World') //=> Hello World!
 *  
 */


var defineCallbackMethod = function(Class, eventName) {
	
	var listenersFor = function(object, eventName) {		
		if (!object._listeners[eventName]) object._listeners[eventName] = []
		return object._listeners[eventName]
	}
	
	Class.prototype[eventName] = function() {
		var listeners = listenersFor(this, eventName)
		for (var i = 0; i < listeners.length; i++) {
			listeners[i].apply(this.thisObject, arguments)
		}
	}
	
	Class.prototype['on' + eventName] = function(callback) {
		var listeners = listenersFor(this, eventName)
		listeners.push(callback)
		return {release: function(){
			for (var i = 0; i < listeners.length; i++) {
				if (listeners[i] == callback) {
					listeners.splice(i, 1)
					this.release = function() {}
					break
				}
			}
		}}
	}
}


//represents an arbitrary property "foo.bar.baz" and propogate events whenever
//that value changes

var Value = defineClass({

	initialize: function(template, expression) {
		var self = this
		self._expression = expression
		self._path = new String(this._expression).split('.')
		self._bindings = []
		self._listeners = []
		self._value = self._default = self._undefined
		template.onattach(function(model) {self.recalculate(model)})
		template.ondetach(function() {self.deactivate()})
		
		var superset = self.constructor.prototype.set
		self.set = function(value) {
			if (self._setting || (self._value == value)) {
				return
			}
			if (self._container) {
				try {
					self._setting = self._recalculating = true
					self._value = value
					freestyle.properties.set(self._container, self._path[self._path.length - 1], value)
				} finally {
					self._setting = self._recalculating = false
				}
					
			}
			superset.call(self, value)
		}
		self.ondeactivate(function() {
			for(var i = 0; i < self._bindings.length; i++) {
				self._bindings[i].release()
			}
			self._value = self._default
			delete self._container
		})
	},	
	get: function() {
		return this._value
	},
	recalculate: function(model) {
		if (this._recalculating) return
		this.deactivate()
		var current = model
		var next
		for (var i = 0; i < this._path.length; i++) {
			if (i > 0) current = next
			if (!current) { //property does not exists
				this.deactivate()
				this._value = (current == null) ? "null" : "FST{" + this._expression + "}"
				return
			}
			var property = this._path[i]
			var self = this
			this._addChangeListener(current, property, model)
			next = current[property]
		}
		this._container = current
		var newValue = current[this._path[this._path.length - 1]]
		this.set(newValue)		
	},
	_addChangeListener: function(object, property, model) {
		var value = this
		this._bindings.push(freestyle.properties.addChangeListener(object, property, function(p) {
			value.recalculate(model)
		}))
	}
})

defineCallbackMethod(Value, 'set')
defineCallbackMethod(Value, 'deactivate')


//the 'event' object which is available to template behaviors

var Events = function(template) {
	var bindings  = []
	var installers = []
	
	template.ondomactive(function() {
		for (var i = 0; i < installers.length; i++) {
			installers[i]()
		}
	})
	
	template.ondominactive(function() {
		for (var binding = bindings.pop(); binding; binding = bindings.pop()) {
			binding.release()
		}
	})
	
	var onevent = this.onevent = function(eventType, elementName, callback) {
		//JDW: The gymnastics with arguments is here to allow the user functions to not specify an
		//element name. If no element name is specified, then it is assumed that listener should
		//apply to the parent view element.
		var elements
		if (typeof arguments[2] == 'undefined') {
				callback = arguments[1]
				elements = template.elements
		} else {
			var element = typeof elementName == 'string' ? template.elements[elementName] : elementName
			if (!element) {
				throw new Error ('no element or slot named ' + elementName)
			}
			elements = [element]
		}
		
		var installer = function() {
			for (var i = 0; i < elements.length; i++) {
				bindings.push(atomic.event.attach(elements[i], eventType, function(event) {
					callback.call(template.thisObject, event, template.model)
				}))
			}
		}
		installers.push(installer)
		if (template.isDomActive()) {
			installer()
		}
	}
	var events = this
	var defType = function(type) {
		events['on' + type] = function(elementName, callback) {
			onevent(type, elementName, callback)
		}
	}
	defType('click')
	defType('keyup')
	defType('keydown')
	defType('focus')
	defType('blur')
	
	this.onattach = function(callback) {
		template.onattach(callback)
	}
	this.ondetach = function(callback) {
		template.ondetach(callback)
	}
	
	this.onpropertychange = function(expression, callback) {
		var value = new Value(template, expression)
		value.onset(function(newValue) {
			callback.call(template.thisObject, newValue, template.model)				
		})		
	}
	
	this.ondomactive = function(callback) {
		template.ondomactive(callback)
	}
}

var TemplateConnector = function(parentTemplate, childTemplate) {
	var domactiveListener, dominactiveListener = {release: function(){}}
	this.firstNode = childTemplate.firstNode
	this.lastNode = childTemplate.lastNode
	this.model = childTemplate.model
	this.insert = function(parentNode, refNode, suppressShutdownHook) {
		childTemplate.insert(parentNode, refNode, suppressShutdownHook)
		domactiveListener = parentTemplate.ondomactive(function(){childTemplate.domactive()})
		dominactiveListener = parentTemplate.ondominactive(function(){childTemplate.dominactive()})
	}
	this.remove = function() {
		childTemplate.remove()
		domactiveListener.release()
		dominactiveListener.release()
	}
	
	this.detach = function() {
		childTemplate.detach()
	}	
}

var Template //predeclare here, otherwise, the compressor gets confused.

var InlineSlot = defineClass({
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

var AttributeSlot = defineClass({
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

var LoopSlot = defineClass({
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

var InputSlot = defineClass({
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

Template = defineClass({
	
	VAR_PATTERN: /\FST\{(.*?)\}/,
	
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
		var self = this
		this.onattach(function(model){self.model = model})
		this.ondetach(function(model){delete self.model})
		this.ondomactive(function() {
			self.isDomActive = function() {return true}
		})
		this.ondominactive(function(){
			self.isDomActive = function(){return false}
		})
		this.isDomActive = function() {return false}
		this.events = new Events(this)
	},
		
	addNode: function(node) {
		this._fragment.insertBefore(node, this.lastNode)
		this._processNode(node)
		if (node.nodeType == atomic.dom.ELEMENT_NODE) {
			this.elements.push(node)
		}
	},
	
	loadBehavior: function(url) {
		var xhr = atomic.xhr();
		xhr.open('GET', url, false);
		xhr.send(null);
		this.addBehavior(xhr.responseText);
	},

	addBehavior: function(source) {
		try {
			behavior = new Function('template', 'event', 'elements', source);
			behavior.call(this.thisObject, this, this.events, this.elements);
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
			case atomic.dom.ELEMENT_NODE:
				if (this._handleElement(node)) {
					var children = []
					for (var i = 0; i < node.childNodes.length; i++) children.push(node.childNodes.item(i))
					while (children.length > 0) {
						this._processNode(children.shift())
					}
				}
				break
			case atomic.dom.TEXT_NODE:
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
		for (var current = node; match = this.VAR_PATTERN.exec(current.data);) {
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


var defineCallbackMethods = function() {
	for (var i = 0; i < arguments.length; i++) {
		defineCallbackMethod(Template, arguments[i])
	}
}
defineCallbackMethods('attach', 'detach', 'domactive', 'dominactive')

var Factory = defineClass({

	initialize: function(options) {
		options = options || {}
		this._nodes = []
		if (options.sourceText) {
			var wrapper = document.createElement('div')
			wrapper.innerHTML = options.sourceText
			for (var current = wrapper.firstChild; current; current = wrapper.firstChild) {
				this._nodes.push(wrapper.removeChild(current))
			}
		} else if (options.nodes) {
			for (var i = 0; i < options.nodes.length; i++) {
				this._nodes.push(options.nodes[i])
			}
		} else if (options.id) {
			this._nodes.push(document.getElementById(options.id))
			var newInstance = this.newInstance
			this.newInstance = function(model) {
				this.newInstance = newInstance
				return newInstance.call(this, model, true)
			}
		} else {
			this._nodes.push(document.createComment('@empty template@'))
		}
	},
	
	newInstance: function(model, inline) {
		var parentNode = inline ? this._nodes[0].parentNode : document.createDocumentFragment()
		var template = new Template(this, parentNode)
		for (var i = 0; i < this._nodes.length; i++) {
			var node = inline ? this._nodes[i] : this._nodes[i].cloneNode(true)
			template.addNode(node, template)
		}
		if (model) {
			template.attach(model)
		}
		if (inline) {
			template.domactive()
		}
		return template
	}
})

return function(options) {
	var t = new Factory(options).newInstance(options.model)
	if (options.insertInto) t.insert(options.insertInto)
	return t
}})()


/* -------------- END js/src/template.js------------- */

/* -------------- BEGIN js/atomic-0.1/atomic/str.js ------------- */ 
if (!this.atomic) { var atomic = {} }

/*
	Object: atomic.str
	Contains utility functions for dealing with strings.
*/
if (!this.atomic.str) { atomic.str = {}; }

	/*
		Function: atomic.str.trim
		Trims whitespace from the start and end of 'str'. The original string is unchanged.

		Parameters:
			str - the string to trim

		Returns:
			a trimmed version of the string
	*/
	atomic.str.trim = function(str) {
		return str.replace(/^\s*|\s*$/g,"")
	}

	/*
		Function: atomic.str.startsWith
		Checks whether a string starts with another string.

		Parameters:
			str - the string to check
			prefix - the prefix to check for

	 	Returns:
			true if 'str' starts with 'prefix'
	*/
	atomic.str.startsWith = function(str, prefix) {
		if (prefix == null) {
			throw new Error('Illegal argument: ' + prefix);
		}
		return str.substring(0, prefix.length) == prefix;
	}

	/*
		Function: atomic.str.endsWith
		Checks whether a string ends with another string.

		Parameters:
			str - the string to check
			suffix - the suffix to check for

	 	Returns:
			true if 'str' ends with 'suffix'
	*/
	atomic.str.endsWith = function(str, suffix) {
		if (suffix == null) throw new Error('Illegal argument: ' + suffix)
		var position = str.length - suffix.length
		if (position < 0) return false
		return str.lastIndexOf(suffix, position) == position;
	}

	/*
		Function: atomic.str.capitalize
		Capitalizes the first letter of 'str'. The original string is unchanged.

		Parameters:
			str - the string to capitalize

	 	Returns:
			a capitalized version of the string
	*/
	atomic.str.capitalize = function(str) {
		if (str.length == 0) return '';
		return str.substring(0,1).toUpperCase() + str.substring(1);
	}

/* -------------- END js/atomic-0.1/atomic/str.js------------- */

/* -------------- BEGIN js/atomic-0.1/atomic/xhr.js ------------- */ 
if (!this.atomic) { var atomic = {} }

/*
	Object: atomic.xhr
	Contains utility functions for dealing with XMLHttpRequests.
*/

/*
	Function: atomic.xhr
	Creates a new XMLHttpRequest (or equivalent) and returns it.

 	Returns:
		a new XMLHttpRequest
*/
atomic.xhr = (function() {
	if (typeof XMLHttpRequest != 'undefined') { //Mozilla
		return function() {
			return new XMLHttpRequest()
		}
	} else if (typeof ActiveXObject != 'undefined') { //IE
		try {
			new ActiveXObject("Msxml2.XMLHTTP")
			return function() {
				return new ActiveXObject("Msxml2.XMLHTTP")
			}
		} catch(error) {}
		try {
			new ActiveXObject("Microsoft.XMLHTTP")
			return function() {
				return new ActiveXObject("Microsoft.XMLHTTP")
			}
		} catch(error) {}
	}
	return function() {
		throw new Error('XMLHttpRequest is not supported on this system.')
	}
})();

/* -------------- END js/atomic-0.1/atomic/xhr.js------------- */

/* -------------- BEGIN js/src/service.js ------------- */ 

freestyle.require(
	'atomic/str.js',
	'atomic/xhr.js',
	'class.js',
	'properties.js'
)

freestyle.service = (function(url) {
	
	var Request = defineClass({
		
		ID_SEQUENCE: 0,
		
		initialize: function(url, method) {
			this._url = url
			this._method = method
			this._sequence = 0
			this._transcript = []
			this._parameters = []
			this._objects = {}
			this._callbacks = []
			this._interpreter = new this.Interpreter(this)
			this._idProperty = '__freestyle_request' + Request.prototype.ID_SEQUENCE++ + '_id__'
			var self = this
		},
		
		addParameter: function(parameter) {
			this._parameters.push(parameter)	
		},
		
		addCallback: function(callback) {
			this._callbacks.push(callback)
		},
		
		sendSync: function() {
			try {
				var xhr = this.prepare(false)
				this._sendTranscript(xhr);
				return this.getResult(xhr)
			} finally {
				this.destroy()
			}
		},
		
		sendAsync: function() {
			var xhr = this.prepare(true)
			var request = this
			xhr.onreadystatechange = function() {
				if (xhr.readyState != 4) return
				try {
					var result = request.getResult(xhr)
					for (var i = 0; i < request._callbacks.length; i++) {
						request._callbacks[i](result)
					}
				} finally {
					request.destroy()
				}
			}
			this._sendTranscript(xhr);
		},
	
		_sendTranscript: function(xhr) {
			var body = 'transcript='+escape(this._transcript.join('\n'));
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.setRequestHeader("Content-length", body.length);
			xhr.setRequestHeader("Connection", "close");
			xhr.send(body)
		},
	
		prepare: function(async) {
			var encodings = []
			for (var i = 0; i < this._parameters.length; i++) {
				encodings.push(this._encode(this._parameters[i]))	
			}
			this._transcript.push('invoke(' + ['"' + this._method + '"'].concat(encodings).join(',') + ')')
			var xhr = atomic.xhr()
			xhr.open('POST', this._url + '?action=call', async)
			return xhr	
		},
		
		getResult: function(xhr) {
			if (xhr.status != 200) {
				throw new Error(xhr.status + ': failed to post to remote method')
			}
			var script = xhr.responseText
			this._interpreter.run(script)
			return this._interpreter.returnValue				
		},
		
		destroy: function() {
			for (var objectId in this._objects) {
				var object = this._objects[objectId]
				if (object) {
					delete object[this._idProperty]
				}
			}		
		},
		
		_encode: function(object) {
			switch (typeof object) {
				case 'undefined':	return 'u()'
				case 'string':		return 's("' + escape(object) + '")'
				case 'object':		return this._encodeObject(object)
				case 'boolean':		return 'b("' + object + '")'
				case 'number':		return 'n("' + object + '")'
				default:			throw new Error('tried to encode unknown object type: ' + typeof object)
			}
		},
		
		_encodeObject: function(object) {
			if (object == null) {
				return 'o(null)'
			} else if (object[this._idProperty]) {
				return 'o("' + object[this._idProperty] + '")'
			} else {
				var objectId = this._sequence++
				this._objects[objectId] = object
				object[this._idProperty] = objectId
				var arrayIndexes = {}
				if (object.constructor == Array) {
					var encodings = []
					for (var i = 0; i < object.length; i++) {
						encodings.push(this._encode(object[i]))
						arrayIndexes[i] = true
					}
					this._transcript.push('arr("' + objectId + '", [' + encodings.join(",") + '])')
				} else {
					this._transcript.push('obj("' + objectId + '")')
				}
				for (var property in object) {
					if (!atomic.str.startsWith(property, "__") && !arrayIndexes[property]) {
						this._transcript.push('prop("' + objectId + '","' + property + '",' + this._encode(object[property]) + ')')
					}
				}
				return this._encodeObject(object)
			}
		},
		
		Interpreter: defineClass({
			initialize: function(request) {
				this._request = request	
			},
			
			run: function(script) {
				eval(script)
				return this._returnValue
			},
			
			o: function(objectId) {
				return this._request._objects[objectId]
			},
		
			bnd: function(objectId, object) {
				object[this._request._idProperty] = objectId
				this._request._objects[objectId] = object
			},
			
			set: function(objectId, property, value) {
				freestyle.properties.set(this.o(objectId), property, value)
			},
			
			err: function(message) {
				throw new Error(message)
			},
			
			splice: function(arrayId, start, howMany, newObjects) {
				freestyle.properties.splice(this.o(arrayId), start, howMany, newObjects)
			},
			
			r: function(returnValue) {
				this.returnValue = returnValue
			}
					
		})
	})
	
	var makeStub = function(url, methodName) {
		return function() {
			var request = new Request(url, methodName)
			var async = false
			for (var i = 0; i < arguments.length; i++) {
				var param = arguments[i]
				if (typeof param == 'function') {
					async = true
					request.addCallback(param) 
				} else {
					request.addParameter(param)
				}
			}
			return async ? request.sendAsync() : request.sendSync()
		}
	}
	var cache = {}
	return function(url) {
		var cached = cache[url];
		if (cached) {
			return cached;
		}
		var xhr = atomic.xhr()
		xhr.open('GET', url, false)
		xhr.send(null)
		if (xhr.status != 200) {
			throw new Error('Unable to get a service definition at ' + url)
		}
		var defineMethods = new Function(xhr.responseText)
		var methods = defineMethods.call(Request.prototype.Interpreter.prototype)
		var service = new Object()
		for (var i = 0; i < methods.length; i++) {
			service[methods[i]] = makeStub(url, methods[i])
		}
		cache[url] = service;
		return service	
	}
})()
		

/* -------------- END js/src/service.js------------- */
