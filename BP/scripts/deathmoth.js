import { world, EntityTypes } from "@minecraft/server";

world.afterEvents.entitySpawn.subscribe(event => {
  const entity = event.entity;

  if (entity.typeId === "ve:deathmoth") {
    try {
      entity.nameTag = "Deathmoth";
      entity.setDynamicProperty("customNamed", true); 
    } catch (e) {
      console.warn("Error:", e);
    }
  }
});
