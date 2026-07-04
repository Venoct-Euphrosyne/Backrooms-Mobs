import { world } from "@minecraft/server";

const EntityNames = {
    "ve:dunk": [
        "Dunk",
        "Snow Dunk",
        "Field Dunk",
        "Stone Dunk",
        "Playhouse Dunk",
        "Beach Dunk",
        "Arcade Dunk"
    ]
}

world.afterEvents.entitySpawn.subscribe(event => {
    const entity = event.entity;
    if (!entity.isValid) return;

    const names = EntityNames[entity.typeId];
    if (names == undefined) return;

    const variant = entity.getComponent('variant')?.value || 0;
    const name = names[variant];
    if (typeof name != 'string') return;

    entity.nameTag = name;
});