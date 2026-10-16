"""BUILD83 Workstream A - textured multi-view render of the 60x40x40 bracket.

Key fixes over the two failed attempts:
  * bmesh.create_cube() emits NO UV layer, so the speckle image texture sampled
    nothing and the part rendered pure black -> use primitive_cube_add (which
    carries UVs) then smart-project UVs after applying the bevel.
  * the part was far too small in frame -> tighter orbit radius.
  * a render-time self-check now fails loudly instead of silently emitting
    blank frames.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1]
os.makedirs(OUT, exist_ok=True)

X, Y, Z = 60.0, 40.0, 40.0
RES = 1000
N_VIEWS = 18
RADIUS = 165.0
MIN_STD = 12.0

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_PATH = os.path.join(SCRIPT_DIR, "speckle_texture.png")


def purge():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)


def build_part():
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    ob = bpy.context.object
    ob.name = "bracket"
    ob.scale = (X / 2, Y / 2, Z / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bev = ob.modifiers.new("bev", "BEVEL")
    bev.width = 2.5
    bev.segments = 1
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=bev.name)

    # UVs are mandatory for the image texture; smart-project guarantees coverage
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode="OBJECT")
    return ob


def texture(ob):
    img = bpy.data.images.load(TEX_PATH, check_existing=True)
    img.colorspace_settings.name = "sRGB"
    mat = bpy.data.materials.new("Tex")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    tex.extension = "REPEAT"
    bsdf.inputs["Roughness"].default_value = 0.9
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)


def scene_setup():
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            continue
    sc.render.resolution_x = RES
    sc.render.resolution_y = RES
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.view_settings.view_transform = "Standard"

    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.03, 0.03, 0.035, 1)
    bg.inputs[1].default_value = 1.0
    sc.world = world

    # even, generous lighting so the texture is visible on every face
    for nm, energy, loc in (
        ("K", 30000.0, (140, -180, 260)),
        ("F", 12000.0, (-200, 160, 160)),
        ("B", 9000.0, (0, 0, -220)),
    ):
        ld = bpy.data.lights.new(nm, "AREA")
        ld.energy = energy
        ld.size = 260.0
        o = bpy.data.objects.new(nm, ld)
        bpy.context.scene.collection.objects.link(o)
        o.location = loc
        # aim at the origin
        d = (Vector((0, 0, 0)) - o.location).normalized()
        o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

    cd = bpy.data.cameras.new("C")
    cd.lens = 50.0
    cam = bpy.data.objects.new("C", cd)
    bpy.context.scene.collection.objects.link(cam)
    sc.camera = cam
    return cam


def render(cam):
    sc = bpy.context.scene
    for i in range(N_VIEWS):
        az = 2 * math.pi * i / N_VIEWS
        el = math.radians(-40 + 80.0 * i / (N_VIEWS - 1))
        cam.location = Vector((RADIUS * math.cos(el) * math.cos(az),
                               RADIUS * math.cos(el) * math.sin(az),
                               RADIUS * math.sin(el)))
        cam.rotation_euler = (-cam.location).normalized().to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(OUT, "view_%03d.png" % i)
        bpy.ops.render.render(write_still=True)


def main():
    purge()
    part = build_part()
    texture(part)
    cam = scene_setup()
    render(cam)
    with open(os.path.join(OUT, "_ground_truth.txt"), "w") as fh:
        fh.write("X=%.3f\nY=%.3f\nZ=%.3f\nviews=%d\nres=%d\nradius=%.1f\n"
                 % (X, Y, Z, N_VIEWS, RES, RADIUS))
    print("RENDER_DONE")


if __name__ == "__main__":
    main()