/**
 * The RightJS UI Autocompleter unit base class
 *
 * Copyright (C) Nikolay V. Nemshilov aka St.
 */
var Autocompleter = new Class(Observer, {
  extend: {
    EVENTS: $w('show hide update load'),
    
    Options: {
      url:        document.location.href,
      param:      'search',
      method:     'get',
      
      minLength:  1,         // the minimal length when it starts work
      threshold:  200,       // the typing pause threshold
      
      cache:      true,      // the use the results cache
      locals:     null,      // an optional local search results list
      
      fxName:     'slide',
      fxDuration: 'short',
      
      spinner:    'native',
      
      relName:    'autocompleter'
    }
  },
  
  /**
   * basic constructor
   *
   * @param mixed the input element reference, a string id or the element instance
   * @param Object options
   */
  initialize: function(input, options) {
    this.$super(options);
    
    this.input     = $(input).onKeyup(this.watch.bind(this));
    this.container = $E('div', {'class': 'autocompleter'}).insertTo(this.input, 'after');
  },
  
  // catching up with some additonal options
  setOptions: function(options) {
    this.$super(options);
    
    // building the correct url template with a placeholder
    if (!this.options.url.includes('%{search}')) {
      this.options.url = (this.options.url.includes('?') ? '&' : '?') + this.options.param + '=%{search}';
    }
  },
  
  // handles the list appearance
  show: function() {
    if (this.container.hidden()) {
      var dims = this.input.dimensions();
      
      this.container.setStyle({
        top: (dims.top + dims.height) + 'px',
        left: dims.left + 'px',
        width: (dims.width - 2) + 'px'
      }).show(this.options.fxName, {
        duration: this.options.fxDuration,
        onFinish: this.fire.bind(this, 'show')
      });
    }
    
    return Autocompleter.current = this;
  },
  
  // handles the list hidding
  hide: function() {
    if (this.container.visible()) {
      this.container.hide(this.options.fxName, {
        duration: this.options.fxDuration,
        onFinish: this.fire.bind(this, 'hide')
      });
    }
    
    Autocompleter.current = null;
    
    return this;
  },
  
// protected

  // receives the keyboard events out of the input element
  watch: function(event) {
    if (this.input.value.length >= this.options.minLength) {
      if (this.timeout) {
        this.timeout.cancel();
      }
      this.timeout = this.trigger.bind(this).delay(this.options.threshold);
    }
  },
  
  // triggers the actual action
  trigger: function() {
    this.timeout = null;
    
    this.cache = this.cache || {};
    var search = this.input.value;
    
    if (this.cache[search]) {
      this.suggest(this.cache[search], search);
    } else if (this.options.locals) {
      this.findLocals(search);
    } else {
      Xhr.load(this.options.url.replace('%{search}', encodeURIComponent(search)), {
        method:  this.options.method,
        spinner: this.options.spinner,
        onComplete: function(response) {
          this.fire('load').suggest(response.responseText, search);
        }.bind(this)
      });
    }
  },
  
  // updates the suggestions list
  suggest: function(result, search) {
    this.container.update(result);
    
    if (this.options.cache) {
      this.cache[search] = result;
    }
    
    return this.fire('update').show();
  },
  
  // performs the locals search
  findLocals: function(search) {
    return $E('ul').insert(
      this.options.locals.map(function(option) {
        if (option.includes(search)) {
          return $E('li', {html: option});
        }
      }).compact()
    );
  }
});