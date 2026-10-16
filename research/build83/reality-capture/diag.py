"""BUILD83 diagnostics: why is the bracket render blank?"""
import json
import os
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1]
os.makedirs(OUT, exist_ok=True)
log = {}


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    log["scene_children"] = len(bpy.context.scene.collection.children)
    log["scene_objects"] = len(bpy.context.scene.collection.objects)
    log["view_layer_objects"] = [o.name for o in bpy.context.view_layer.objects]

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.object
    body.name = "bracket"
    body.scale = (30.0, 20.0, 20.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    me = body.data
    log["verts"] = len(me.vertices)
    log["polys"] = len(me.polygons)
    bb = [tuple(round(c, 3) for c in v) for v in body.bound_box]
    log["local_bbox"] = [min(v[i] for v in bb) for i in range(3)] + \
                        [max(v[i] for v in bb) for i in range(3)]

    # world + camera
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.08, 0.08, 0.09, 1)
    bg.inputs[1].default_value = 1.4
    bpy.context.scene.world = world

    cam_data = bpy.data.cameras.new("C")
    cam_data.lens = 52.0
    cam = bpy.data.objects.new("C", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    sc = bpy.context.scene
    sc.camera = cam

    # does the object actually appear in the render?
    log["body_in_view_layer"] = body.name in [o.name for o in bpy.context.view_layer.objects]
    log["body_visible"] = body.visible_get()

    lights = []
    for name, energy, loc, rot in (
        ("K", 40000.0, (150, -200, 320), (38, 0, 33)),
        ("F", 15000.0, (-220, 180, 180), (-42, 0, -125)),
    ):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.size = 220.0
        ob = bpy.data.objects.new(name, ld)
        bpy.context.scene.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = tuple(__import__("math").radians(a) for a in rot)
        lights.append(name)
    log["lights"] = lights

    # simple emissive material so visibility is unambiguous
    mat = bpy.data.materials.new("M")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.85, 1)
        bsdf.inputs["Roughness"].default_value = 0.5
    me.materials.append(mat)
    log["material_slots"] = len(me.materials)

    sc.render.resolution_x = 600
    sc.render.resolution_y = 600
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = os.path.join(OUT, "diag.png")

    centre = Vector((0, 0, 0))
    radius = 235.0
    import math
    az = math.radians(35)
    el = math.radians(25)
    cam.location = centre + Vector((radius * math.cos(el) * math.cos(az),
                                    radius * math.cos(el) * math.sin(az),
                                    radius * math.sin(el)))
    d = (centre - cam.location).normalized()
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    log["cam_loc"] = [round(c, 2) for c in cam.location]
    log["cam_rot"] = [round(c, 4) for c in cam.rotation_euler]

    bpy.ops.render.render(write_still=True)
    log["rendered"] = os.path.exists(sc.render.filepath)

    with open(os.path.join(OUT, "diag.json"), "w") as fh:
        json.dump(log, fh, indent=2)
    print("DIAG_WRITTEN")


if __name__ == "__main__":
    main()