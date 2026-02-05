import { world } from "@minecraft/server";

const allowedMobs = ["ve:dunk"];

world.afterEvents.playerInteractWithEntity.subscribe(({ player, beforeItemStack: item, target }) => {
    const tameable = target.getComponent("tameable");
    if (!allowedMobs.includes(target.typeId) || !tameable || tameable.isTamed || item) return;
    tameable.tame(player)
})