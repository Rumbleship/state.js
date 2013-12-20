function initStateJS(q){function p(x,v){var w,u,t;for(w=0,u=x.length;w<u;w=w+1){if(v(x[w])){if(t){throw"single found more than one result"}t=x[w]}}return t}function r(u,t,v){if(!u.steelbreeze_statejs_active){u.steelbreeze_statejs_active=[]}u.steelbreeze_statejs_active[t]=v}function d(u,t){if(u.steelbreeze_statejs_active){return u.steelbreeze_statejs_active[t]}}function g(u,t,v){if(!u.steelbreeze_statejs_current){u.steelbreeze_statejs_current=[]}u.steelbreeze_statejs_current[t]=v}function i(u,t){if(u.steelbreeze_statejs_current){return u.steelbreeze_statejs_current[t]}}function e(v,w,t){this.guard=t||function(){return true};if(w&&(w!==null)){var y=v.owner.ancestors(),x=w.owner.ancestors(),u=0;while(y.length>u&&x.length>u&&y[u]===x[u]){u=u+1}this.sourceAncestorsToExit=y.slice(u);this.targetAncestorsToEnter=x.slice(u);this.sourceAncestorsToExit.reverse();this.source=v;this.target=w}v[t&&t.length>0?"transitions":"completions"].push(this)}e.prototype.traverse=function(v,w){var u,t;if(this.source){this.source.beginExit(v);this.source.endExit(v);for(u=0,t=this.sourceAncestorsToExit.length;u<t;u=u+1){this.sourceAncestorsToExit[u].endExit(v)}}if(this.effect){for(u=0,t=this.effect.length;u<t;u=u+1){this.effect[u](w)}}if(this.target){for(u=0,t=this.targetAncestorsToEnter.length;u<t;u=u+1){this.targetAncestorsToEnter[u].beginEnter(v)}this.target.beginEnter(v);this.target.endEnter(v,false)}};e.Else=function(t,u){e.call(this,t,u,function(){return false})};e.Else.prototype=e.prototype;e.Else.prototype.constructor=e.Else;function o(t){if(t.length===1){return t[0]}throw"initial pseudo states must have one and only one outbound transition"}function a(u){var w,t,v=[];for(w=0,t=u.length;w<t;w=w+1){if(u[w].guard()){v.push(u[w])}}if(v.length>0){return v[(v.length-1)*Math.random()]}return p(u,function(x){return x instanceof e.Else})}function c(u){var t=p(u,function(v){return v.guard()});if(t){return t}t=p(u,function(v){return v instanceof e.Else});if(t){return t}throw"junction PseudoState has no valid competion transitions"}var f={Choice:{isInitial:false,isHistory:false,completions:a},DeepHistory:{isInitial:true,isHistory:true,completions:o},Initial:{isInitial:true,isHistory:false,completions:o},Junction:{isInitial:false,isHistory:false,completions:c},ShallowHistory:{isInitial:true,isHistory:true,completions:o},Terminate:{isInitial:false,isHistory:false,completions:null}};function l(u,t){this.name=u;this.owner=t}l.prototype.qualifiedName=function(){return this.owner?this.owner+"."+this.name:this.name};l.prototype.ancestors=function(){var t=this.owner?this.owner.ancestors():[];t.push(this);return t};l.prototype.beginExit=function(t){};l.prototype.endExit=function(t){r(t,this,false)};l.prototype.beginEnter=function(t){if(d(t,this)){this.beginExit(t);this.endExit(t)}r(t,this,true)};l.prototype.endEnter=function(u,t){};l.prototype.toString=function(){return this.qualifiedName()};function h(u,v,t){l.call(this,u,t);this.kind=v;this.completions=[];if(this.kind.isInitial){this.owner.initial=this}}h.prototype=new l();h.prototype.constructor=h;h.prototype.endEnter=function(u,t){if(this.kind===f.Terminate){u.IsTerminated=true}else{this.kind.completions(this.completions).traverse(u,t)}};function n(u,t){l.call(this,u,t);this.completions=[];this.transitions=[]}n.prototype=new l();n.prototype.constructor=n;n.prototype.isComplete=function(t){return true};n.prototype.endExit=function(v){var u,t;if(this.exit){for(u=0,t=this.exit.length;u<t;u=u+1){this.exit[u]()}}l.prototype.endExit.call(this,v)};n.prototype.beginEnter=function(v){var u,t;l.prototype.beginEnter.call(this,v);if(this.owner){g(v,this.owner,this)}if(this.entry){for(u=0,t=this.entry.length;u<t;u=u+1){this.entry[u]()}}};n.prototype.endEnter=function(v,u){if(this.isComplete(v)){var t=p(this.completions,function(w){return w.guard()});if(t){t.traverse(v,u)}}};n.prototype.process=function(u,v){var t=p(this.transitions,function(w){return w.guard(v)});if(!t){return false}t.traverse(u,v);return true};function j(u,t){n.call(this,u,t)}j.prototype=new n();j.prototype.constructor=j;j.prototype.isComplete=function(t){var u=i(t,this);return t.isTerminated||u===null||u.isFinalState||d(t,u)===false};j.prototype.beginExit=function(t){var u=i(t,this);if(u){u.beginExit(t);u.endExit(t)}};j.prototype.endEnter=function(u,t){var v=(t||this.initial.kind.isHistory?i(u,this):this.initial)||this.initial;v.beginEnter(u);v.endEnter(u,t||this.initial.kind===f.DeepHistory);n.prototype.endEnter.call(this,u,t)};j.prototype.process=function(t,u){return n.prototype.process.call(this,t,u)||i(t,this).process(t,u)};function s(u,t){n.call(this,u,t);this.regions=[]}s.prototype=new n();s.prototype.constructor=s;s.prototype.isComplete=function(v){var u,t;if(!v.isTerminated){for(u=0,t=this.regions.length;u<t;u=u+1){if(!this.regions[u].isComplete(v)){return false}}}return true};s.prototype.beginExit=function(v){var u,t;for(u=0,t=this.regions.length;u<t;u=u+1){if(d(v,this.regions[u])){this.regions[u].beginExit(v);this.regions[u].endExit(v)}}};s.prototype.endEnter=function(w,u){var v,t;for(v=0,t=this.regions.length;v<t;v=v+1){this.regions[v].beginEnter(w);this.regions[v].endEnter(w)}n.prototype.endEnter.call(w,u)};s.prototype.process=function(w,x){var v,u,t=false;if(!w.isTerminated){if((t=n.prototype.process.call(this,w,x))===false){for(v=0,u=this.regions.length;v<u;v=v+1){t=this.regions[v].process(w,x)||t}}}return t};function k(u,t){n.call(this,u,t);this.isFinalState=true}k.prototype=new n();k.prototype.constructor=k;delete k.prototype.comlpetions;delete k.prototype.transitions;k.prototype.process=function(t,u){return false};function b(u,t){l.call(this,u,t);this.initial=null;if(this.owner){this.owner.regions.push(this)}}b.prototype=new l();b.prototype.constructor=b;b.prototype.isComplete=function(t){var u=i(t,this);return t.isTerminated||u===null||u.isFinalState||d(t,u)===false};b.prototype.initialise=function(t){this.beginEnter(t);this.endEnter(t,false)};b.prototype.beginExit=function(t){var u=i(t,this);if(u){u.beginExit(t);u.endExit(t)}};b.prototype.endEnter=function(u,t){var v=(t||this.initial.kind.isHistory?i(u,this):this.initial)||this.initial;v.beginEnter(u);v.endEnter(u,t||this.initial.kind===f.DeepHistory)};b.prototype.process=function(t,u){if(t.isTerminated){return false}return d(t,this)&&i(t,this).process(t,u)};function m(t){l.call(this,t);this.regions=[]}m.prototype=new l();m.prototype.constructor=m;m.prototype.isComplete=function(v){var u,t;if(!v.isTerminated){for(u=0,t=this.regions.length;u<t;u=u+1){if(!this.regions[u].isComplete(v)){return false}}}return true};m.prototype.initialise=function(t){this.beginEnter(t);this.endEnter(t,false)};m.prototype.beginExit=function(v){var u,t;for(u=0,t=this.regions.length;u<t;u=u+1){if(d(v,this.regions[u])){this.regions[u].beginExit(v);this.regions[u].endExit(v)}}};m.prototype.endEnter=function(w,u){var v,t;for(v=0,t=this.regions.length;v<t;v=v+1){this.regions[v].beginEnter(w);this.regions[v].endEnter(w,u)}l.prototype.endEnter.call(w,u)};m.prototype.process=function(w,x){var v,u,t=false;if(!w.isTerminated){for(v=0,u=this.regions.length;v<u;v=v+1){t=this.regions[v].process(w,x)||t}}return t};q.PseudoStateKind=f;q.PseudoState=h;q.SimpleState=n;q.CompositeState=j;q.OrthogonalState=s;q.FinalState=k;q.Region=b;q.StateMachine=m;q.Transition=e}if(this.exports){initStateJS(this.exports)}else{if(this.define){this.define(function(b,a,c){initStateJS(a)})}else{initStateJS(this)}};