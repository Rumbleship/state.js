"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
/**
 * Finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */
/**
 * An enumeration used to dictate the behavior of instances of the [[PseudoState]] class.
 *
 * Use these constants as the `kind` parameter when creating new [[PseudoState]] instances to define their behavior (see the description of each member).
 */
var PseudoStateKind;
(function (PseudoStateKind) {
    /**
     * Enables a dynamic conditional branches; within a compound [[Transition]].
     *
     * All outbound transition guards from a [[Choice]] [[PseudoState]] are evaluated upon entering the [[PseudoState]]: if a single [[Transition]] is found, it will be traversed; if many are found, an arbitary one will be selected and traversed; if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     */
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    /** As per [[ShallowHistory]], but the history semantic cascades through all child regions irrespective of their history semantics. */
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    /** Defines the [[PseudoState]] that will be the initial staring point when entering its enclosing [[Region]]. */
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    /**
     * Enables a static conditional branches; within a compound [[Transition]].
     *
     * All outbound transition guards from a [[Junction]] [[PseudoState]] are evaluated upon entering the [[PseudoState]]: if a single [[Transition]] is found, it will be traversed; if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
     */
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    /** Ensures that re-entry of the enclosing [[Region]] will start at the last known active state configuration. */
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory";
    /**
     * Entering a terminate [[PseudoState]] implies that the execution of [[StateMachine]] is terminated and will not respond to any more messages.
     * @depricated since v5.10.2 (use a transition to a top-leval state with no outbound transitions).
     */
    PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
})(PseudoStateKind = exports.PseudoStateKind || (exports.PseudoStateKind = {}));
/**
 * An enumeration of that dictates the precise behavior of a [[Transition]] instance.
 *
 * Use these constants as the `kind` parameter when creating new [[Transition]] instances to define their behavior (see the description of each member).
 * @note Within the [[Transition]] constructor the `kind` parameter will be validated and adjusted as necessary.
 */
var TransitionKind;
(function (TransitionKind) {
    /** The [[Transition]], if triggered, will exit the source [[Vertex]] and enter the target [[Vertex]] irrespective of the proximity of source and target in terms of their enclosing [[Region]]. */
    TransitionKind[TransitionKind["External"] = 0] = "External";
    /** The [[Transition]], if triggered, occurs without exiting or entering the source [[State]]; it does not cause a state therefore no [[State]] exit or entry [[Action]]s will be invoked, only [[Transition]] [[Action]]s. */
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    /** The [[Transition]], if triggered, will not exit the source [[State]] as the target [[Vertex]] is a child of the source [[State]]. No exit [[Action]]s are invoked from the source [[State]], but [[Transition]] and entry [[Action]]s will be invoked as required. */
    TransitionKind[TransitionKind["Local"] = 2] = "Local";
})(TransitionKind = exports.TransitionKind || (exports.TransitionKind = {}));
/**
 * An element within a model.
 * @param TParent The type of the [[Element]]s parent.
 */
class Element {
    /**
     * Creates a new instance of the [[Element]] class.
     * @param parent The parent of this [[Element]]
     */
    constructor(parent) {
        this.parent = parent;
    }
}
exports.Element = Element;
/**
 * An element within a model that has a name.
 * @param TParent The type of the [[NamedElement]]s parent.
 */
class NamedElement extends Element {
    /**
     * Creates a new instance of the [[NamedElement]] class.
     * @param name The name of the [[NamedElement]].
     * @param parent The parent of this [[NamedElement]]
     */
    constructor(name, parent) {
        super(parent);
        this.name = name;
        this.qualifiedName = parent
            ? parent.toString() + NamedElement.namespaceSeparator + name
            : name;
    }
    /** Returns the [[NamedElement]] [[name]] as a namespace delimited by [[namespaceSeparator]]. */
    toString() {
        return this.qualifiedName;
    }
}
/** The symbol used to separate [[NamedElement]] names within a fully qualified name. Change this static member to create different styles of qualified name generated by the [[toString]] method. */
NamedElement.namespaceSeparator = '.';
exports.NamedElement = NamedElement;
/**
 * An [[NamedElement]] within a [[StateMachine]] model that is a container (parent) of [[Vertex]] instances; a [[Region]] will be the child of a composite [[State]].
 * @note A [[Region]] is implicitly inserted into a composite [[State]] if not explicitly defined.
 */
class Region extends NamedElement {
    /**
     * Creates a new instance of the [[Region]] class.
     * @param name The name of the [[Region]].
     * @param state The parent [[State]] that this [[Region]] will be a child of.
     */
    constructor(name, state) {
        super(name, state);
        /** The [[Vertex]] instances that are children of this [[Region]]. */
        this.vertices = new Array();
        this.parent.regions.push(this);
        this.getRoot().clean = false;
    }
    /** Removes this [[Region]] instance from the [[StateMachine]] model. */
    remove() {
        for (const vertex of this.vertices) {
            vertex.remove();
        }
        this.parent.regions.splice(this.parent.regions.indexOf(this), 1);
        this.getRoot().clean = false;
    }
    /** Returns the root [[StateMachine]] instance that this [[Region]] is a part of. */
    getRoot() {
        return this.parent.getRoot();
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitRegion]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitRegion(this, arg1);
    }
}
/** The name given to [[Region]] instances implicitly created (when a [[State]] instance is passed to a [[Vertex]] constructor as it's parent. */
Region.defaultName = 'default';
exports.Region = Region;
/** An abstract [[NamedElement]] within a [[StateMachine]] model that can be the source or target of a [[Transition]]. */
class Vertex extends NamedElement {
    /**
     * Creates a new instance of the [[Vertex]] class.
     * @param name The name of the [[Vertex]].
     * @param parent The parent [[State]] or [[Region]].
     * @note Specifting a [[State]] as the parent with cause the constructor to make this [[Vertex]] as child of the [[State]]s [[defaultRegion]].
     */
    constructor(name, parent) {
        super(name, parent instanceof State ? parent.getDefaultRegion() : parent);
        /** The [[Transition]]s originating from this [[Vertex]]. */
        this.outgoing = new Array();
        /** The [[Transition]]s targeting this [[Vertex]]. */
        this.incoming = new Array();
        if (this.parent) {
            this.parent.vertices.push(this);
        }
        this.getRoot().clean = false;
    }
    /** Returns the root [[StateMachine]] instance that this [[Vertex]] is a part of. */
    getRoot() {
        return this.parent.getRoot(); // parent is only undefined for instances of StateMachine
    }
    /** Returns the ancestry of the [[Vertex]], form the root [[StateMachine]] to this [[Vertex]]. */
    ancestry() {
        return (this.parent
            ? this.parent.parent.ancestry()
            : new Array()).concat(this);
    }
    /** Removes the [[Vertex]] from the [[StateMachine]] model. */
    remove() {
        for (const transitions of [this.outgoing, this.incoming]) {
            for (const transition of transitions) {
                transition.remove();
            }
        }
        if (this.parent) {
            this.parent.vertices.splice(this.parent.vertices.indexOf(this), 1);
        }
        this.getRoot().clean = false;
    }
    /**
     * Creates a new [[Transition]] originating from this [[Vertex]]. Newly created transitions are completion [[Transition]]s; they will be evaluated after a [[Vertex]] has been entered if it is deemed to be complete. The [[Transition]] can be converted to be event triggered by adding a guard condition via the [[Transition]]s where method.
     * @param target The destination of the [[Transition]]; omit for internal [[Transition]]s.
     * @param kind The kind the [[Transition]]; use this to set [[Local]] or [[External]] (the default if omitted) [[Transition]] semantics.
     */
    to(target, kind = TransitionKind.External) {
        return new Transition(this, target, kind);
    }
}
exports.Vertex = Vertex;
/**
 * An [[Vertex]] within a [[StateMachine]] model that represents an transitory [[Vertex]].
 *
 * [[PseudoState]]s are required in state machine models to define the default stating state of a [[Region]]. [[PseudoState]]s are also used for defining history semantics or to facilitate more complex transitions. A [[Terminate]] [[PseudoState]] kind is also available to immediately terminate processing within the entire state machine instance.
 */
class PseudoState extends Vertex {
    /**
     * Creates a new instance of the [[PseudoState]] class.
     * @param name The name of the [[PseudoState]].
     * @param parent The parent [[State]] or [[Region]] that this [[PseudoState]] will be a child of.
     * @param kind The kind of the [[PseudoState]] which determines its use and behavior.
     */
    constructor(name, parent, kind = PseudoStateKind.Initial) {
        super(name, parent);
        this.kind = kind;
    }
    /**
     * Tests a [[PseudoState]] to determine if it is a history [[PseudoState]].
     * History [[PseudoState]]s are of kind: [[ShallowHistory]] or [[DeepHistory]].
     * @returns True if the [[PseudoStateKind]] is [[DeepHistory]] or [[ShallowHistory]].
     */
    isHistory() {
        return (this.kind === PseudoStateKind.DeepHistory ||
            this.kind === PseudoStateKind.ShallowHistory);
    }
    /**
     * Tests a [[PseudoState]] to determine if it is an initial [[PseudoState]].
     * Initial [[PseudoState]]s are of kind: [[Initial]], [[ShallowHistory]], or [[DeepHistory]].
     * @returns True if the [[PseudoStateKind]] is [[Initial]], [[DeepHistory]] or [[ShallowHistory]].
     */
    isInitial() {
        return this.kind === PseudoStateKind.Initial || this.isHistory();
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitPseudoState]] method on it.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitPseudoState(this, arg1);
    }
}
exports.PseudoState = PseudoState;
/**
 * A [[Vertex]] within a [[StateMachine]] model that represents an invariant condition within the life of the state machine instance.
 *
 * [[State]] instances are one of the fundamental building blocks of the [[StateMachine]] model; they typically represent conditions where the machine is awaiting an eveny to trigger a [[Transition]]. User-defined [[Action]]s can be defined for both [[State]] entry and [[State]] exit.
 */
class State extends Vertex {
    /**
     * Creates a new instance of the [[State]] class.
     * @param name The name of the [[State]].
     * @param parent The parent [[State]] or [[Region]] that this [[State is a child of]].
     * @note When the parent parameter is of type [[State]], a default [[Region]] is created and subsiquently accessible via the [[defaultRegion]] method.
     */
    constructor(name, parent) {
        super(name, parent);
        /** The user-defined behavior (built up via calls to the [[exit]] method). */
        /** @internal */ this.exitBehavior = new Array();
        /** The user-defined behavior (built up via calls to the [[entry]] method). */
        /** @internal */ this.entryBehavior = new Array();
        /** The [[Region]] instances that are a child of  this [[State]]. */
        this.regions = new Array();
    }
    /**
     * Returns the default [[Region]] for the state.
     * @note A default [[Region]] is created on demand if the [[State]] is passed into a child [[Vertex]] constructor..
     */
    getDefaultRegion() {
        return (this.defaultRegion ||
            (this.defaultRegion = new Region(Region.defaultName, this)));
    }
    /** Tests the [[State]] to see if it is a [[FinalState]]; a [[FinalState]] is either defined by creating an instance of the [[FinalState]] class or any other [[State]] instance that has no outbound transitions. */
    isFinal() {
        return this.outgoing.length === 0;
    }
    /** Tests the [[State]] to see if it is a simple [[State]]; a simple [[State]] is one that has no child [[Region]]s. */
    isSimple() {
        return this.regions.length === 0;
    }
    /** Tests the [[State]] to see if it is a composite [[State]]; a composite [[State]] is one that has one or more child [[Region]]s. */
    isComposite() {
        return this.regions.length > 0;
    }
    /** Tests the [[State]] to see if it is an orthogonal [[State]]; an orthogonal [[State]] is one that has more than one child [[Region]]s. */
    isOrthogonal() {
        return this.regions.length > 1;
    }
    /** Removes this [[State]] instance from the [[StateMachine]] model. */
    remove() {
        for (const region of this.regions) {
            region.remove();
        }
        super.remove();
    }
    /**
     * Adds an [[Action]] that is executed each time the [[State]] instance is exited due to a [[Transition]].
     * @param exitAction The [[Action]] to add to the [[State]] instance exit behavior.
     */
    exit(exitAction) {
        this.exitBehavior.push(exitAction);
        this.getRoot().clean = false;
        return this;
    }
    /**
     * Adds and [[Action]] that is executed each time the [[State]] instance is entered due to a [[Transition]].
     * @param entryAction The [[Action]] to add to the [[State]] instance entry behavior.
     */
    entry(entryAction) {
        this.entryBehavior.push(entryAction);
        this.getRoot().clean = false;
        return this;
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitState]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitState(this, arg1);
    }
}
exports.State = State;
/**
 * A [[State]] within a [[StateMachine]] model that represents completion of the life of the containing [[Region]] for the state machine instance.
 * @note A [[FinalState]] cannot have outbound transitions.
 * @depricated since v5.10.1 (use [[State]] class instead).
 */
class FinalState extends State {
    /**
     * Creates a new instance of the [[FinalState]] class.
     * @param name The name of the [[FinalState]].
     * @param parent The parent [[State]] or [[Region]] that owns the [[FinalState]].
     */
    constructor(name, parent) {
        super(name, parent);
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitFinalState]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitFinalState(this, arg1);
    }
}
exports.FinalState = FinalState;
/** The root of a [[StateMachine]] model. */
class StateMachine extends State {
    /**
     * Creates a new instance of the [[StateMachine]] class.
     * @param name The name of the [[StateMachine]].
     */
    constructor(name) {
        super(name, undefined);
        /** Internal flag: false if the state machine model requires recompilation. */
        /** @internal */ this.clean = false;
    }
    /**
     * Returns the root [[StateMachine]].
     * @note that if this [[StateMachine]] is embeded within another, the ultimate root will be returned.
     */
    getRoot() {
        return this.parent ? this.parent.getRoot() : this;
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitStateMachine]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitStateMachine(this, arg1);
    }
}
exports.StateMachine = StateMachine;
/** A function that always returns true. */
/** @internal */ const TrueFunc = () => {
    return true;
};
/** A function that always returns false. */
/** @internal */ const FalseFunc = () => {
    return false;
};
/**
 * Represents a [[State]] change that may occur in response to a message; essentially, the [[Transition]] represents a path between two [[Vertex]] instances.
 *
 * Transitions come in a variety of types and are described by the [[TransitionKind]] enumeration.
 */
class Transition {
    /**
     * Creates a new instance of the [[Transition]] class.
     * @param source The source [[Vertex]] of the [[Transition]].
     * @param source The target [[Vertex]] of the [[Transition]]; this is an optional parameter, omitting it will create an [[Internal]] [[Transition]].
     * @param kind The kind the [[Transition]]; use this to set [[Local]] or [[External]] (the default if omitted) transition semantics.
     */
    constructor(source, target, kind = TransitionKind.External) {
        this.source = source;
        this.target = target;
        this.kind = kind;
        /** The user-defined [[Action]]s that will be invoked when this [[Transition]] is traversed. */
        /** @internal */ this.transitionBehavior = new Array();
        if (!this.target) {
            this.kind = TransitionKind.Internal;
        }
        this.guard =
            source instanceof PseudoState
                ? TrueFunc
                : message => message === this.source;
        this.source.outgoing.push(this);
        if (this.target) {
            this.target.incoming.push(this);
        }
        this.source.getRoot().clean = false;
    }
    /**
     * Turns a [[Transition]] into an else transition.
     * Else [[Transitions]]s can be used at [[Junction]] or [[Choice]] [[PseudoState]] if no other [[Transition]] guards evaluate true, an else [[Transition]] if present will be traversed.
     */
    else() {
        this.guard = FalseFunc;
        return this;
    }
    /**
     * Defines the guard condition for the [[Transition]].
     * @param guard The guard condition that must evaluate true for the [[Transition]] to be traversed.
     * @note While this supports the fluent API style, multiple calls to the [[when]] method will will just result in the guard condition specified in last [[when]] call made.
     */
    when(guard) {
        this.guard = guard;
        return this;
    }
    /**
     * Adds and [[Action]] to a [[Transition]].
     * @param transitionAction The [[Action]] to add to the [[Transition]] behavior.
     * @note Make multiple calls to this method to add mutiple actions to the [[Transition]] behavior.
     */
    effect(transitionAction) {
        this.transitionBehavior.push(transitionAction);
        this.source.getRoot().clean = false;
        return this;
    }
    /** Removes the [[Transition]] from the [[StateMachine]] model. */
    remove() {
        this.source.outgoing.splice(this.source.outgoing.indexOf(this), 1);
        if (this.target) {
            this.target.incoming.splice(this.target.incoming.indexOf(this), 1);
        }
        this.source.getRoot().clean = false;
    }
    /**
     * Accepts an instance of a [[Visitor]] and calls the [[visitTransition]] method on it.
     * @param TArg1 The type of the first optional parameter.
     * @param visitor The [[Visitor]] instance.
     * @param arg1 An optional argument to pass into the [[Visitor]].
     */
    accept(visitor, arg1) {
        return visitor.visitTransition(this, arg1);
    }
    /** Returns a the [[Transition]] name. */
    toString() {
        return `[${this.target ? this.source + ' -> ' + this.target : this.source}]`;
    }
}
exports.Transition = Transition;
/**
 * A working implementation of the [[IInstance]] interface.
 * @note It is possible to create other custom state machine instance classes in other ways (e.g. serialisable JSON); just implement the [[IInstance]] interface.
 */
class StateMachineInstance {
    /**
     * Creates a new instance of the [[StateMachineInstance]] class.
     * @param name The optional name of the [[StateMachineInstance]].
     * @param context The optional injectable [[SMContext ]] of the [[StateMachineInstance]]
     */
    constructor(name = 'unnamed', context = { logger: exports.console, trace_id: uuid.v4() }) {
        this.name = name;
        this.context = context;
        /** The last known [[Vertex]] of any [[Region]] within the state machine instance. */
        /** @internal */ this.current = {};
        /** The last known [[State]] of any [[Region]] within the state machine instance. */
        /** @internal */ this.last = {};
        /** Indicates that the [[StateMachine]] instance reached was terminated by reaching a [[Terminate]] [[PseudoState]]. */
        this.isTerminated = false;
        this.name = name;
    }
    getLogger() {
        return this.context.logger;
    }
    getContextTraceId() {
        return this.context.trace_id;
    }
    /**
     * Updates the last known [[State]] for a given [[Region]].
     * @param region The [[Region]] to set the last known [[State]] of.
     * @param vertex The last known [[Vertex]] of the given [[Region]].
     */
    setCurrent(region, vertex) {
        this.current[region.toString()] = vertex;
        if (vertex instanceof State) {
            this.last[region.toString()] = vertex;
        }
    }
    /**
     * Returns the last known [[Vertex]] for a given [[Region]].
     * @param region The [[Region]] to get the last known [[Vertex]] of.
     * @returns The last known [[Vertex]] of the given [[Region]].
     */
    getCurrent(region) {
        return this.current[region.toString()];
    }
    /**
     * Returns the last known [[State]] for a given [[Region]].
     * @param region The [[Region]] to get the last known [[State]] of.
     * @returns The last known [[State]] of the given [[Region]].
     */
    getLastKnownState(region) {
        return this.last[region.toString()];
    }
    /**
     * Returns the name of the [[StateMachineInstance]].
     * @returns The name of this [[StateMachineInstance]].
     */
    toString() {
        return this.name;
    }
    trace(msg) { }
}
exports.StateMachineInstance = StateMachineInstance;
/** Manages the active state configuration of a state machine instance using a serializable JSON structure. */
class JSONInstance {
    /**
     * Creates a new instance of the [[JSONInstance]] class.
     * @param name The optional name of the [[JSONInstance]].
     * @param context The optional inejctable execution [[SMContext]] to use with the [[JSONInstance]].
     */
    constructor(name = 'unnamed', context = { logger: exports.console, trace_id: uuid.v4() }) {
        this.name = name;
        this.context = context;
        /** The last known [[Vertex]] of any [[Region]] within the state machine instance. */
        /** @internal */ this.current = {};
        /** Indicates that the state machine instance has reached a [[PseudoStateKind.Terminate]] [[PseudoState]] and therfore will no longer respond to messages. */
        this.isTerminated = false;
        this.transitionTrace = [];
    }
    getLogger() {
        return this.context.logger;
    }
    getContextTraceId() {
        return this.context.trace_id;
    }
    /**
     * Updates the last known [[State]] for a given [[Region]].
     * @param region The [[Region]] to set the last known [[State]] of.
     * @param vertex The last known [[Vertex]] of the given [[Region]].
     */
    setCurrent(region, vertex) {
        this.current[region.toString()] = vertex;
        if (vertex instanceof State) {
            this.getNode(region).lastKnown = vertex.name;
        }
    }
    /**
     * Returns the last known [[Vertex]] for a given [[Region]].
     * @param region The [[Region]] to get the last known [[Vertex]] of.
     * @returns The last known [[Vertex]] of the given [[Region]].
     */
    getCurrent(region) {
        return this.current[region.toString()];
    }
    /**
     * Returns the last known [[State]] for a given [[Region]].
     * @param region The [[Region]] to get the last known [[State]] of.
     * @returns The last known [[State]] of the given [[Region]].
     */
    getLastKnownState(region) {
        const lastKnown = this.getNode(region).lastKnown;
        return region.vertices.reduce((result, item) => item instanceof State && item.name === lastKnown ? item : result, undefined);
    }
    /** Finds a node within the active state configuration for a given Region. */
    getNode(stateOrRegion) {
        if (stateOrRegion.parent) {
            const parentNode = this.getNode(stateOrRegion.parent);
            let node = parentNode.children.reduce((result, item) => (item.name === stateOrRegion.name ? item : result), undefined);
            if (!node) {
                node = { name: stateOrRegion.name, children: [] };
                parentNode.children.push(node);
            }
            return node;
        }
        else {
            return (this.activeStateConfiguration ||
                (this.activeStateConfiguration = {
                    name: stateOrRegion.name,
                    children: []
                }));
        }
    }
    /**
     * Returns the active state configuration as a JSON string.
     * @returns A JSON string representation of the active state configuration.
     */
    toJSON() {
        let obj = {
            activeState: this.activeStateConfiguration,
            eventHistory: this.transitionTrace
        };
        return JSON.stringify(obj);
    }
    /**
     * Sets the active state configuration from a JSON string.
     * @param json A JSON string representation of the active state configuration.
     */
    fromJSON(json) {
        let obj = JSON.parse(json);
        this.activeStateConfiguration = obj.activeState;
        this.transitionTrace = obj.eventHistory;
        return obj.activeState;
    }
    /**
     * Returns the name of the [[StateMachineInstance]].
     * @returns The name of this [[StateMachineInstance]].
     */
    toString() {
        return this.name;
    }
    trace(msg) {
        this.transitionTrace.unshift(msg);
    }
}
exports.JSONInstance = JSONInstance;
/**
 * Implementation of a visitor pattern.
 * @param TArg1 The type of the first optional parameter in the visit methods.
 */
class Visitor {
    /**
     * Visits a [[NamedElement]] within a [[StateMachine]] model.
     * @param region The [[Vertex]] or [[Region]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitNamedElement(namedElement, arg1) { }
    /**
     * Visits a [[Region]] within a [[StateMachine]] model.
     * @param region The [[Region]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitRegion(region, arg1) {
        this.visitNamedElement(region, arg1);
        for (const vertex of region.vertices) {
            vertex.accept(this, arg1);
        }
    }
    /**
     * Visits a [[Vertex]] within a [[StateMachine]] model.
     * @param vertex The [[Vertex]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitVertex(vertex, arg1) {
        this.visitNamedElement(vertex, arg1);
        for (const transition of vertex.outgoing) {
            transition.accept(this, arg1);
        }
    }
    /**
     * Visits a [[PseudoState]] within a [[StateMachine]] model.
     * @param pseudoState The [[PseudoState]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitPseudoState(pseudoState, arg1) {
        return this.visitVertex(pseudoState, arg1);
    }
    /**
     * Visits a [[State]] within a [[StateMachine]] model.
     * @param state The [[State]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitState(state, arg1) {
        const result = this.visitVertex(state, arg1);
        for (const region of state.regions) {
            region.accept(this, arg1);
        }
        return result;
    }
    /**
     * Visits a [[FinalState]] within a [[StateMachine]] model.
     * @param finalState The [[FinalState]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitFinalState(finalState, arg1) {
        return this.visitState(finalState, arg1);
    }
    /**
     * Visits a [[StateMachine]] within a [[StateMachine]] model.
     * @param state machine The [[StateMachine]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitStateMachine(model, arg1) {
        return this.visitState(model, arg1);
    }
    /**
     * Visits a [[Transition]] within a [[StateMachine]] model.
     * @param transition The [[Transition]] being visited.
     * @param arg1 An optional parameter passed into the accept method.
     */
    visitTransition(transition, arg1) { }
}
exports.Visitor = Visitor;
/**
 * Determines if a [[Vertex]] is currently active for a given state machine instance; i.e. that it has been entered but not yet exited.
 * @param vertex The [[Vertex]] to test.
 * @param instance The state machine instance.
 */
/** @internal */ function isActive(vertex, instance) {
    return vertex.parent
        ? isActive(vertex.parent.parent, instance) &&
            instance.getLastKnownState(vertex.parent) === vertex
        : true;
}
/**
 * Tests a [[State]] or [[Region]] within a state machine instance to see if its lifecycle is complete.
 *
 * A [[State]] is deemed complete when it has reached a [[FinalState]] or a [[State]] that has no outgoing [[Transition]]s; a [[Region]] is deemed complete if all its child [[Region]]s are complete.
 * @param stateOrRegion The [[State]] or [[Region]] to test.
 * @param instance The state machine instance.
 */
function isComplete(stateOrRegion, instance) {
    if (stateOrRegion instanceof Region) {
        const currentState = instance.getLastKnownState(stateOrRegion);
        return currentState !== undefined && currentState.isFinal();
    }
    else {
        return stateOrRegion.regions.every(region => isComplete(region, instance));
    }
}
exports.isComplete = isComplete;
/** Concatenates arrays of [[Action]]s. */
/** @internal */ function push(to, ...actions) {
    for (const set of actions) {
        for (const action of set) {
            to.push(action);
        }
    }
}
/**
 * Invokes behavior.
 * @param actions The set of [[Action]]s to invoke.
 * @param message The message that caused the [[Transition]] to be traversed that is triggering this behavior.
 * @param instance The state machine instance.
 * @param deepHistory True if [[DeepHistory]] semantics are in force at the time the behavior is invoked.
 */
/** @internal */ function invoke(actions, message, instance, deepHistory = false) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const action of actions) {
            yield action(message, instance, deepHistory);
        }
    });
}
/** The function used for to generate random numbers; may be overriden for testing or other specific purposes. */
exports.random = (max) => Math.floor(Math.random() * max);
/**
 * Updates the method used to generate random numbers.
 * @param value The new method that will be used to generate random numbers.
 */
function setRandom(value) {
    exports.random = value;
}
exports.setRandom = setRandom;
/**
 * Initialises a state machine instance and/or [[StateMachine]] model.
 *
 * Passing just the [[StateMachine]] model will initialise the model, passing the [[StateMachine]] model and instance will initialse the instance and if necessary, the model.
 * @param model The [[StateMachine]] model. If autoInitialiseModel is true (or no instance is specified) and the model has changed, the model will be initialised.
 * @param instance The optional state machine instance to initialise.
 * @param autoInitialiseModel Defaulting to true, this will cause the model to be initialised prior to initialising the instance if the model has changed.
 */
function initialise(model, instance, autoInitialiseModel = true) {
    return __awaiter(this, void 0, void 0, function* () {
        if (instance) {
            // initialise the state machine model if necessary
            if (autoInitialiseModel && model.clean === false) {
                yield initialise(model);
            }
            instance.getLogger().log(`initialise ${instance}`);
            // enter the state machine instance for the first time
            yield invoke(model.onInitialise, undefined, instance);
        }
        else {
            exports.console.log(`initialise ${model.name}`);
            // initialise the state machine model
            model.accept(new InitialiseElements(), false);
            model.clean = true;
        }
    });
}
exports.initialise = initialise;
/**
 * Passes a message to a state machine instance for evaluation; a message may trigger a [[Transition]].
 * @param model The [[StateMachine]] model.
 * @param instance The state machine instance.
 * @param message The message to evaluate.
 * @param autoInitialiseModel Defaulting to true, this will cause the [[StateMachine]] model to be initialised prior to initialising the instance if the model has changed.
 * @returns Returns true if the message caused a [[Transition]].
 */
function evaluate(model, instance, message, autoInitialiseModel = true) {
    return __awaiter(this, void 0, void 0, function* () {
        // initialise the state machine model if necessary
        if (autoInitialiseModel && model.clean === false) {
            yield initialise(model);
        }
        instance.getLogger().log(`${instance} evaluate ${message}`);
        instance.trace(`evaluate ${message}`);
        // terminated state machine instances will not evaluate messages
        if (instance.isTerminated) {
            return false;
        }
        return yield evaluateState(model, instance, message);
    });
}
exports.evaluate = evaluate;
/**
 * Evaluates messages against a [[State]], executing a [[Transition]].
 * @param state The [[State]].
 * @param instance The state machine instance.
 * @param message The message to evaluate.
 * @returns Returns true if the message caused a [[Transition]].
 */
/** @internal */ function evaluateState(state, instance, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = false;
        // delegate to child regions first if a non-continuation
        if (message !== state) {
            //state.regions.every( async (region) => {
            for (let region in state.regions) {
                const currentState = instance.getLastKnownState(state.regions[region]);
                if (currentState &&
                    (yield evaluateState(currentState, instance, message))) {
                    result = true;
                    if (!isActive(state, instance)) {
                        // NOTE: this just controls the every loop; also isActive is a litte costly so using sparingly
                        break;
                    }
                }
            }
        }
        // if a transition occured in a child region, check for completions
        if (result) {
            if (message !== state && isComplete(state, instance)) {
                yield evaluateState(state, instance, state);
            }
        }
        else {
            // otherwise look for a transition from this state
            const transitions = state.outgoing.filter(transition => transition.guard(message, instance));
            if (transitions.length === 1) {
                // execute if a single transition was found
                result = yield traverse(transitions[0], instance, message);
            }
            else if (transitions.length > 1) {
                // error if multiple transitions evaluated true
                instance.getLogger().error(`${state}: multiple outbound transitions evaluated true for message ${message}`);
            }
        }
        return result;
    });
}
/**
 * Traverses a [[Transition]].
 *
 * This method encapsulates the logic for dynamic and static conditional [[Transition]] branches ([[Choice]] and [[Junction]] respectively).
 * @param transition The [[Transition]] to traverse.
 * @param instance The state machine instance.
 * @param message The message that triggerd this [[Transition]] traversal.
 * @returns Always returns true.
 */
/** @internal */ function traverse(transition, instance, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let onTraverse = transition.onTraverse.slice(0);
        // process static conditional branches - build up all the transition behavior prior to executing
        while (transition.target &&
            transition.target instanceof PseudoState &&
            transition.target.kind === PseudoStateKind.Junction) {
            // proceed to the next transition
            transition = selectTransition(transition.target, instance, message);
            // concatenate behavior before and after junctions
            push(onTraverse, transition.onTraverse);
        }
        // execute the transition behavior
        yield invoke(onTraverse, message, instance);
        if (transition.target) {
            // process dynamic conditional branches if required
            if (transition.target instanceof PseudoState &&
                transition.target.kind === PseudoStateKind.Choice) {
                yield traverse(selectTransition(transition.target, instance, message), instance, message);
            }
            // test for completion transitions
            else if (transition.target instanceof State &&
                isComplete(transition.target, instance)) {
                yield evaluateState(transition.target, instance, transition.target);
            }
        }
        return true;
    });
}
/**
 * Select next leg of a composite [[Transition]] after a [[Choice]] or [[Junction]] [[PseudoState]].
 * @param pseudoState The [[Choice]] or [[Junction]] [[PseudoState]].
 * @param instance The state machine instance.
 * @param message The message that triggerd the transition to the [[PseudoState]].
 */
/** @internal */ function selectTransition(pseudoState, instance, message) {
    const transitions = pseudoState.outgoing.filter(transition => transition.guard(message, instance));
    if (pseudoState.kind === PseudoStateKind.Choice) {
        return transitions.length !== 0
            ? transitions[exports.random(transitions.length)]
            : findElse(pseudoState);
    }
    if (transitions.length > 1) {
        instance.getLogger().error(`Multiple outbound transition guards returned true at ${pseudoState} for ${message}`);
    }
    return transitions[0] || findElse(pseudoState);
}
/** Look for an else [[Transition]] from a [[Junction]] or [[Choice]] [[PseudoState]]. */
/** @internal */ function findElse(pseudoState) {
    return pseudoState.outgoing.filter(transition => transition.guard === FalseFunc)[0];
}
/** Class used to temporarily hold behavior during [[StateMachine]] initialisation. */
/** @internal */ class Behavior {
    constructor() {
        /** The [[Action]]s to execute when leaving a [[Vertex]] or [[Region]] during a state transition (including and cascaded [[Action]]s). */
        this.leave = new Array();
        /** The initial [[Action]]s to execute when entering a [[Vertex]] or [[Region]] during a state transition. */
        this.beginEnter = new Array();
        /** The follow-on [[Action]]s to execute when entering a [[Vertex]] or [[Region]] during a state transition (including and cascaded [[Action]]s). */
        this.endEnter = new Array();
    }
    /** The full set of [[Action]]s to execute when entering a [[Vertex]] or [[Region]] during a state transition (including and cascaded [[Action]]s). */
    enter() {
        const result = new Array();
        push(result, this.beginEnter, this.endEnter);
        return result;
    }
}
/** Initialises the transitions within a [[StateMachine]]. */
/** @internal */ class InitialiseTransitions extends Visitor {
    visitTransition(transition, behavior) {
        return __awaiter(this, void 0, void 0, function* () {
            // reset transition behavior
            transition.onTraverse = new Array();
            // initialise transition behavior based on transition kind
            switch (transition.kind) {
                case TransitionKind.Internal:
                    this.visitInternalTransition(transition, behavior);
                    break;
                case TransitionKind.Local:
                    yield this.visitLocalTransition(transition, behavior);
                    break;
                case TransitionKind.External:
                    this.visitExternalTransition(transition, behavior);
                    break;
            }
        });
    }
    // initialise internal transitions: these do not leave the source state
    visitInternalTransition(transition, behavior) {
        // perform the transition behavior
        push(transition.onTraverse, transition.transitionBehavior);
        // add a test for completion
        if (exports.internalTransitionsTriggerCompletion) {
            transition.onTraverse.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
                if (transition.source instanceof State &&
                    isComplete(transition.source, instance)) {
                    yield evaluateState(transition.source, instance, transition.source);
                }
            }));
        }
    }
    // initialise transitions within the same region
    visitLocalTransition(transition, behavior) {
        return __awaiter(this, void 0, void 0, function* () {
            transition.onTraverse.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
                const targetAncestors = transition.target.ancestry(); // local transitions will have a target
                let i = 0;
                // find the first inactive element in the target ancestry
                while (isActive(targetAncestors[i], instance)) {
                    ++i;
                }
                // exit the active sibling // TODO: check logic
                const currentState = instance.getCurrent(targetAncestors[i].parent); // NOTE: possible fix
                if (currentState) {
                    yield invoke(behavior(currentState).leave, message, instance);
                }
                // perform the transition action;
                yield invoke(transition.transitionBehavior, message, instance);
                // enter the target ancestry
                while (i < targetAncestors.length) {
                    this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], (behavior) => __awaiter(this, void 0, void 0, function* () { return yield invoke(behavior, message, instance); }));
                }
                // trigger cascade
                yield invoke(behavior(transition.target).endEnter, message, instance);
            }));
        });
    }
    // initialise external transitions: these are abritarily complex
    visitExternalTransition(transition, behavior) {
        const sourceAncestors = transition.source.ancestry(), targetAncestors = transition.target.ancestry(); // external transtions always have a target
        let i = Math.min(sourceAncestors.length, targetAncestors.length) - 1;
        // find the index of the first uncommon ancestor (or for external transitions, the source)
        while (sourceAncestors[i - 1] !== targetAncestors[i - 1]) {
            --i;
        }
        // leave source ancestry and perform the transition effect
        push(transition.onTraverse, behavior(sourceAncestors[i]).leave, transition.transitionBehavior);
        // enter the target ancestry
        while (i < targetAncestors.length) {
            this.cascadeElementEntry(transition, behavior, targetAncestors[i++], targetAncestors[i], behavior => push(transition.onTraverse, behavior));
        }
        // trigger cascade
        push(transition.onTraverse, behavior(transition.target).endEnter);
    }
    cascadeElementEntry(transition, behavior, vertex, next, task) {
        task(behavior(vertex).beginEnter);
        if (next && vertex instanceof State) {
            for (const region of vertex.regions) {
                task(behavior(region).beginEnter);
                if (region !== next.parent) {
                    task(behavior(region).endEnter);
                }
            }
        }
    }
}
/** Bootstraps all the elements within a state machine model. */
/** @internal */ class InitialiseElements extends Visitor {
    constructor() {
        super(...arguments);
        /** @internal */ this.behaviors = {};
    }
    /** @internal */ behavior(namedElement) {
        return (this.behaviors[namedElement.toString()] ||
            (this.behaviors[namedElement.toString()] = new Behavior()));
    }
    visitNamedElement(namedElement, deepHistoryAbove) {
        this.behavior(namedElement).leave.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
            instance.getLogger().log(`${instance} leave ${namedElement.qualifiedName}`);
            instance.trace(`leave ${namedElement.qualifiedName}`);
        }));
        this.behavior(namedElement).beginEnter.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
            instance.getLogger().log(`${instance} enter ${namedElement.qualifiedName}`);
            instance.trace(`enter ${namedElement.qualifiedName}`);
        }));
    }
    visitRegion(region, deepHistoryAbove) {
        const regionInitial = region.vertices.reduce((result, vertex) => vertex instanceof PseudoState && vertex.isInitial() ? vertex : result, undefined);
        // cascade to child vertices
        for (const vertex of region.vertices) {
            vertex.accept(this, deepHistoryAbove ||
                (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory));
        }
        // leave the curent active child state when exiting the region
        this.behavior(region).leave.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
            const currentState = instance.getCurrent(region); // NOTE: fix for Joel bug
            if (currentState) {
                yield invoke(this.behavior(currentState).leave, message, instance);
            }
        }));
        // enter the appropriate child vertex when entering the region
        if (deepHistoryAbove || !regionInitial || regionInitial.isHistory()) {
            // NOTE: history needs to be determined at runtime
            this.behavior(region).endEnter.push((message, instance, deepHistory) => __awaiter(this, void 0, void 0, function* () {
                return yield invoke(this.behavior(deepHistory || regionInitial.isHistory()
                    ? instance.getLastKnownState(region) || regionInitial
                    : regionInitial).enter(), message, instance, deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory);
            }));
        }
        else {
            // TODO: validate initial region
            push(this.behavior(region).endEnter, this.behavior(regionInitial).enter());
        }
        this.visitNamedElement(region, deepHistoryAbove);
    }
    visitVertex(vertex, deepHistoryAbove) {
        super.visitVertex(vertex, deepHistoryAbove);
        // update the parent regions current state
        this.behavior(vertex).beginEnter.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
            if (vertex.parent) {
                instance.setCurrent(vertex.parent, vertex);
            }
        }));
    }
    visitPseudoState(pseudoState, deepHistoryAbove) {
        super.visitPseudoState(pseudoState, deepHistoryAbove);
        // evaluate comppletion transitions once vertex entry is complete
        if (pseudoState.isInitial()) {
            this.behavior(pseudoState).endEnter.push((message, instance, deepHistory) => __awaiter(this, void 0, void 0, function* () {
                let currentState;
                if ((deepHistory || pseudoState.isHistory()) &&
                    (currentState = instance.getLastKnownState(pseudoState.parent))) {
                    yield invoke(this.behavior(pseudoState).leave, message, instance);
                    yield invoke(this.behavior(currentState).enter(), message, instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory);
                }
                else {
                    yield traverse(pseudoState.outgoing[0], instance);
                }
            }));
        }
        else if (pseudoState.kind === PseudoStateKind.Terminate) {
            // terminate the state machine instance upon transition to a terminate pseudo state
            this.behavior(pseudoState).beginEnter.push((message, instance) => __awaiter(this, void 0, void 0, function* () {
                instance.isTerminated = true;
                return;
            }));
        }
    }
    visitState(state, deepHistoryAbove) {
        // NOTE: manually iterate over the child regions to control the sequence of behavior
        for (const region of state.regions) {
            region.accept(this, deepHistoryAbove);
            push(this.behavior(state).leave, this.behavior(region).leave);
            push(this.behavior(state).endEnter, this.behavior(region).enter());
        }
        this.visitVertex(state, deepHistoryAbove);
        // add the user defined behavior when entering and exiting states
        push(this.behavior(state).leave, state.exitBehavior);
        push(this.behavior(state).beginEnter, state.entryBehavior);
    }
    visitStateMachine(stateMachine, deepHistoryAbove) {
        super.visitStateMachine(stateMachine, deepHistoryAbove);
        // initiaise all the transitions once all the elements have been initialised
        stateMachine.accept(new InitialiseTransitions(), (vertexOrRegion) => this.behavior(vertexOrRegion));
        // define the behavior for initialising a state machine instance
        stateMachine.onInitialise = this.behavior(stateMachine).enter();
    }
}
/** The object used for log, warning and error messages. */
exports.console = {
    log(message, ...optionalParams) { },
    warn(message, ...optionalParams) { },
    error(message, ...optionalParams) {
        throw message;
    }
};
;
/**
 * Replace the default console object to implement custom logging.
 * @param newConsole An object to send log, warning and error messages to.
 */
function setConsole(newConsole) {
    exports.console = newConsole;
}
exports.setConsole = setConsole;
/** Flag to make internal [[Transition]]s trigger completion events for [[State]] they are in. */
exports.internalTransitionsTriggerCompletion = false;
/**
 * Change the bahaviour of internal [[Transition]]s in respect to trigering completion events for the [[State] they are in.
 * @param value True for internal [[Transition]]s in respect to trigering completion events for the [[State] they are in.
 */
function setInternalTransitionsTriggerCompletion(value) {
    exports.internalTransitionsTriggerCompletion = value;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
/**
 * Validates a [[StateMachine]] model for correctness (see the constraints defined within the UML Superstructure specification).
 *
 * Validation warnings and errors are sent to the console.warn and console.error callbacks.
 * @param model The [[StateMachine]] model to validate.
 */
function validate(model) {
    model.accept(new Validator());
}
exports.validate = validate;
/** Class used to validate a [[StateMachine]] model for semantic integrity. */
/** @internal */ class Validator extends Visitor {
    /** Validates a [[PseudoState]]. */
    visitPseudoState(pseudoState) {
        super.visitPseudoState(pseudoState);
        if (pseudoState.kind === PseudoStateKind.Choice ||
            pseudoState.kind === PseudoStateKind.Junction) {
            // [7] In a complete statemachine, a junction vertex must have at least one incoming and one outgoing transition.
            // [8] In a complete statemachine, a choice vertex must have at least one incoming and one outgoing transition.
            if (pseudoState.outgoing.length === 0) {
                exports.console.error(`${pseudoState}: ${pseudoState.kind} pseudo states must have at least one outgoing transition.`);
            }
            // choice and junction pseudo state can have at most one else transition
            if (pseudoState.outgoing.filter((transition) => {
                return transition.guard === FalseFunc;
            }).length > 1) {
                exports.console.error(`${pseudoState}: ${pseudoState.kind} pseudo states cannot have more than one Else transitions.`);
            }
        }
        else {
            // non choice/junction pseudo state may not have else transitions
            if (pseudoState.outgoing.filter((transition) => {
                return transition.guard === FalseFunc;
            }).length !== 0) {
                exports.console.error(`${pseudoState}: ${pseudoState.kind} pseudo states cannot have Else transitions.`);
            }
            if (pseudoState.isInitial()) {
                if (pseudoState.outgoing.length > 1) {
                    // [1] An initial vertex can have at most one outgoing transition.
                    // [2] History vertices can have at most one outgoing transition.
                    exports.console.error(`${pseudoState}: initial pseudo states must have no more than one outgoing transition.`);
                }
                else if (pseudoState.outgoing.length === 1) {
                    // [9] The outgoing transition from an initial vertex may have a behavior, but not a trigger or guard.
                    if (pseudoState.outgoing[0].guard !== TrueFunc) {
                        exports.console.error(`${pseudoState}: initial pseudo states cannot have a guard condition.`);
                    }
                }
            }
        }
    }
    /** Validates a [[Region]]. */
    visitRegion(region) {
        super.visitRegion(region);
        // [1] A region can have at most one initial vertex.
        // [2] A region can have at most one deep history vertex.
        // [3] A region can have at most one shallow history vertex.
        let initial = 0, deepHistory = 0, shallowHistory = 0;
        for (const vertex of region.vertices) {
            if (vertex instanceof PseudoState) {
                if (vertex.kind === PseudoStateKind.Initial) {
                    initial++;
                }
                else if (vertex.kind === PseudoStateKind.DeepHistory) {
                    deepHistory++;
                }
                else if (vertex.kind === PseudoStateKind.ShallowHistory) {
                    shallowHistory++;
                }
            }
        }
        if (initial > 1) {
            exports.console.error(`${region}: regions may have at most one initial pseudo state.`);
        }
        if (deepHistory > 1) {
            exports.console.error(`${region}: regions may have at most one deep history pseudo state.`);
        }
        if (shallowHistory > 1) {
            exports.console.error(`${region}: regions may have at most one shallow history pseudo state.`);
        }
    }
    visitState(state) {
        super.visitState(state);
        if (state.regions.filter(region => region.name === Region.defaultName)
            .length > 1) {
            exports.console.error(`${state}: a state cannot have more than one region named ${Region.defaultName}`);
        }
    }
    /** Validates a [[FinalState]]. */
    visitFinalState(finalState) {
        super.visitFinalState(finalState);
        // [1] A final state cannot have any outgoing transitions.
        if (finalState.outgoing.length !== 0) {
            exports.console.error(`${finalState}: final states must not have outgoing transitions.`);
        }
        // [2] A final state cannot have regions.
        if (finalState.regions.length !== 0) {
            exports.console.error(`${finalState}: final states must not have child regions.`);
        }
        // [4] A final state has no entry behavior.
        if (finalState.entryBehavior.length > 0) {
            exports.console.warn(`${finalState}: final states may not have entry behavior.`);
        }
        // [5] A final state has no exit behavior.
        if (finalState.exitBehavior.length > 0) {
            exports.console.warn(`${finalState}: final states may not have exit behavior.`);
        }
    }
    /** Validates a [[Transition]]. */
    visitTransition(transition) {
        super.visitTransition(transition);
        // Local transition target vertices must be a child of the source vertex
        if (transition.kind === TransitionKind.Local) {
            if (transition.target &&
                transition.target.ancestry().indexOf(transition.source) === -1) {
                exports.console.error(`${transition}: local transition target vertices must be a child of the source composite sate.`);
            }
        }
    }
}
