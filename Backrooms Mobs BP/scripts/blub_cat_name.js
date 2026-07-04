import { world, EntityTypes } from "@minecraft/server";

world.afterEvents.entitySpawn.subscribe(event => {
  const entity = event.entity;

  if (entity.typeId === "ve:blub_cat") {
    try {
      entity.nameTag = "Blub Cat";
      entity.setDynamicProperty("customNamed", true);
    } catch (e) {
      console.warn("Error:", e);
    }
  }
});