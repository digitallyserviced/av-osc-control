var _widgets_base = require('../common/_widgets_base')

var _matrices_base = module.exports = function(widgetData){

    _widgets_base.apply(this,arguments)

    this.widget = $(`
        <div class="matrix">
        </div>\
        `)
    this.value = []

    this.widget.getValue = function(){
        console.log(this.value)
        return this.value
    }.bind(this)

    this.widget.on('sync',function(e){
        if (e.id==this.widgetData.id) return
        this.value[e.widget.parent().index()] = e.widget.getValue()
        this.widget.trigger({type:'sync',id:this.widgetData.id,widget:this.widget})
    }.bind(this))

    this.widget.enableTraversingGestures()

}



_matrices_base.prototype = Object.create(_widgets_base.prototype)

_matrices_base.prototype.constructor = _matrices_base

_matrices_base.prototype.getValue = function(){
    return this.value
}
