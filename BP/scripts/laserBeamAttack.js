import { world, system, MolangVariableMap, EntityDamageCause } from "@minecraft/server";

 /** @param {import("@minecraft/server").Vector3} from @param {import("@minecraft/server").Vector3} to @returns {Number} */
function distance(from, to) {
    const dx = ((from.x || 0) - (to.x || 0)), dy = ((from.y || 0) - (to.y || 0)), dz = ((from.z || 0) - (to.z || 0));
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

/** @param {import("@minecraft/server").Vector3} from @param {import("@minecraft/server").Vector3} to @returns {import("@minecraft/server").Vector3} */
function getDirection3D(from, to) {
    const dx = ((to.x || 0) - (from.x || 0)), dy = ((to.y || 0) - (from.y || 0)), dz = ((to.z || 0) - (from.z || 0));
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
    return {
        x: dx/distance,
        y: dy/distance,
        z: dz/distance
    };
}

/** @type {WeakMap<import('@minecraft/server').Entity, import('@minecraft/server').Entity>} */
const EntityTargetMap = new WeakMap();

const targetIdsObjectiveId = 'sert:target_ids';

system.run(() => {
    if (world.scoreboard.getObjective(targetIdsObjectiveId) == undefined) {
        world.scoreboard.addObjective(targetIdsObjectiveId);
    }
});

system.afterEvents.scriptEventReceive.subscribe(data => {
    if (data.id == 'sert:clear_target') return EntityTargetMap.delete(data.sourceEntity);
    if (data.id != 'sert:register_target') return;

    const entity = data.sourceEntity;
    const objective = world.scoreboard.getObjective(targetIdsObjectiveId);
    if (entity == undefined || !entity.isValid || objective == undefined) return;

    const targetId = objective.getScore(entity);
    if (targetId == undefined) return;

    const target = objective.getParticipants().find(p => objective.getScore(p) == targetId)?.getEntity();
    objective.removeParticipant(entity);

    if (target == undefined) return;
    else objective.removeParticipant(target);

    EntityTargetMap.set(entity, target);
});

/** @param {import('@minecraft/server').Vector3} location @param {import('@minecraft/server').Entity} target */
function castLaserBeamParticles(location, target) {
    const velocity = target.getVelocity(); const targetLocation = { ...target.location, y: (target.location.y+target.getHeadLocation().y)/2 };
    const newTargetLocation = { x: targetLocation.x+velocity.x, y: targetLocation.y+velocity.y, z: targetLocation.z+velocity.z };

    const map = new MolangVariableMap();
    map.setSpeedAndDirection('vector', distance(location, targetLocation), getDirection3D(location, targetLocation));
    map.setSpeedAndDirection('new_vector', distance(location, newTargetLocation), getDirection3D(location, newTargetLocation));

    target.dimension.spawnParticle('sert:watcher_laser', location, map);
}

world.afterEvents.dataDrivenEntityTrigger.subscribe(data => {
    if (data.eventId != 'sert:start_laser_attack') return;

    const entity = data.entity;
    const startTick = system.currentTick;

    const target = EntityTargetMap.get(entity);
    if (target == undefined || !target.isValid) return;
    if (distance(target.location, entity.location) < 2.5) return;

    const runId = system.runInterval(() => {
        const timePassed = system.currentTick - startTick;

        if (!entity.isValid) return system.clearRun(runId);
        if (timePassed > 60) return system.clearRun(runId);
        if (entity.getEffect('slowness')?.amplifier == 255) return system.clearRun(runId);

        const target = EntityTargetMap.get(entity);
        if (target == undefined || !target.isValid) return system.clearRun(runId);

        const targetLocation = { ...target.location, y: (target.location.y+target.getHeadLocation().y)/2 };
        entity.teleport(entity.location, { facingLocation: targetLocation });

        if (timePassed < 12) return;

        const eyeLocation = entity.getHeadLocation();
        eyeLocation.y += 0.2;

        const raycast = entity.dimension.getBlockFromRay(eyeLocation, getDirection3D(eyeLocation, targetLocation), { maxDistance: 48 });

        if (raycast?.block) {
            const block = raycast.block; const faceLocation = raycast.faceLocation;
            const raycastPoint = { x: block.x + (raycast.face == 'East' ? (1-faceLocation.x) : faceLocation.x), y: block.y + faceLocation.y, z: block.z + (raycast.face == 'South' ? (1-faceLocation.z) : faceLocation.z) };

            if (distance(raycastPoint, eyeLocation) < distance(targetLocation, eyeLocation)) {
                castLaserBeamParticles(eyeLocation, { location: raycastPoint, dimension: block.dimension, getHeadLocation() { return raycastPoint }, getVelocity() { return { x: 0, y: 0, z: 0 }; } });
                return;
            }
        }

        castLaserBeamParticles(eyeLocation, target);
        target.applyDamage(1, { damagingEntity: entity, cause: EntityDamageCause.temperature });
    });
});