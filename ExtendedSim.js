Sim.prototype.unitStep = function () {
    //first checks if any steps require servicing before moving to the next step
    //as the timer cannot move if there are event
    for(var i=0;i<sim.queue.data.length;i++)
    {
        //if an event is found at that current time it is serviced and the unitStep() stops
        if(sim.queue.data[i].deliverAt == sim.time())
        {
            sim.step();
            return;
        }
    }
    //if there are no events at this time, move timer by one
    this.simTime +=1;
};

Sim.MyRequest = function (entity, scheduleTime, deliverTime, instruction, duration) {
    this.entity = entity;
    this.scheduledAt = scheduleTime;
    this.deliverAt = deliverTime;
    this.callbacks = [];
    this.cancelled = !1;
    this.instruction = instruction;
    this.group = null;
    this.duration = duration;

};
Sim.MyRequest.prototype.done = function (a, b, c) {
    this.callbacks.push([a, b, c]);
    return this
};
Sim.MyRequest.prototype.deliver = function () {
    this.cancelled || (this.cancel(), this.callbacks && (this.group && this.group.length > 0 ? this._doCallback(this.group[0].source, this.msg, this.group[0].data) : this._doCallback(this.source, this.msg, this.data)))
};
Sim.MyRequest.prototype.cancel = function () {
    if (this.group && this.group[0] != this)return this.group[0].cancel();
    if (this.noRenege)return this;
    if (!this.cancelled) {
        this.cancelled = !0;
        if (this.deliverAt == 0)this.deliverAt = this.entity.time();
        if (this.source && (this.source instanceof Sim.Buffer || this.source instanceof Sim.Store))this.source.progressPutQueue.call(this.source), this.source.progressGetQueue.call(this.source);
        if (this.group)for (var a = 1; a < this.group.length; a++)if (this.group[a].cancelled = !0, this.group[a].deliverAt ==
            0)this.group[a].deliverAt = this.entity.time()
    }
};
Sim.MyRequest.prototype._doCallback = function (a, b, c) {
    for (var d = 0; d < this.callbacks.length; d++) {
        var f = this.callbacks[d][0];
        if (f) {
            var e = this.callbacks[d][1];
            if (!e)e = this.entity;
            var h = this.callbacks[d][2];
            e.callbackSource = a;
            e.callbackMessage = b;
            e.callbackData = c;
            h ? h instanceof Array ? f.apply(e, h) : f.call(e, h) : f.call(e);
            e.callbackSource = null;
            e.callbackMessage = null;
            e.callbackData = null
        }
    }
};
Sim.MyRequest.prototype.cancelRenegeClauses = function () {
    this.noRenege = !0;
    if (this.group && this.group[0] == this)for (var a = 1; a < this.group.length; a++)if (this.group[a].cancelled = !0, this.group[a].deliverAt == 0)this.group[a].deliverAt = this.entity.time()
};