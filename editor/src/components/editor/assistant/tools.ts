import { fontManager } from "@openvideo/engine-pixi";
import { duplicateClip, splitClip, trimClip } from "./action-handlers";
import { core, projectStore } from "@/lib/project";
import { generateCaptionClips } from "@/lib/caption-generator";
import { nanoid } from "@openvideo/core";

export const handleAddClip = async (input: any) => {
  const { text, prompt, targetId, duration, width, height, left, top, action } = input;
  const from = input.from ?? 0;
  const to = input.to ? (input.to - from < 1 ? 1 : input.to) : from + 5;

  // Resolve raw type from assetType, type, or action
  let rawType = input.assetType || input.type || "";
  if (rawType) {
    rawType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
  }

  const type =
    rawType ||
    (action === "add_text"
      ? "Text"
      : action === "add_image"
        ? "Image"
        : action === "add_video"
          ? "Video"
          : action === "add_audio"
            ? "Audio"
            : "Video");

  const clip: any = {
    id: targetId || `clip_${Date.now()}`,
    type,
    name: text || prompt || `${type} clip`,
    display: {
      from: from * 1000000,
      to: to * 1000000,
    },
    duration: (to - from) * 1000000,
    style: {},
  };

  if (width) clip.width = width;
  if (height) clip.height = height;
  if (left !== undefined) clip.left = left;
  if (top !== undefined) clip.top = top;

  // Configure specific type properties with fallback assets to prevent timeline engine crashes
  if (type === "Video") {
    clip.src =
      input.url ||
      input.src ||
      "https://cdn.scenify.io/AUTOCROP/VIDEO/e4545b0a-56e8-4982-80af-9b51094909f7/ec042fbe-01d8-4ef2-8389-c166eae76a77.mp4";
    clip.metadata = { previewUrl: clip.src };
    clip.trim = { from: 0, to: (to - from) * 1_000_000 };
  } else if (type === "Image") {
    clip.src = input.url || input.src || "https://picsum.photos/800/600";
    clip.metadata = { previewUrl: clip.src };
  } else if (type === "Text") {
    clip.text = text || input.text || "Hello Text";
    clip.style = {
      fontSize: 100,
      fill: "#ffffff",
      fontFamily: "Inter",
    };
  } else if (type === "Audio") {
    clip.src =
      input.url ||
      input.src ||
      "https://cdn.scenify.io/AUTOCROP/VIDEO/e4545b0a-56e8-4982-80af-9b51094909f7/ec042fbe-01d8-4ef2-8389-c166eae76a77.mp4";
  }

  const addOptions = type === "Video" ? { objectFit: "contain" as const } : undefined;
  await core.clip.add(clip, addOptions);
};

export const handleUpdateClip = async (input: any) => {
  const {
    left,
    top,
    width,
    height,
    start,
    targetId,
    clipId,
    fontSize,
    fontFamily,
    fill,
    opacity,
    volume,
    playbackRate,
  } = input;
  const id = targetId || clipId;
  if (!id) return;

  const updates: any = {};
  if (left !== undefined) updates.left = left;
  if (top !== undefined) updates.top = top;
  if (width !== undefined) updates.width = width;
  if (height !== undefined) updates.height = height;
  if (start !== undefined) updates.display = { ...updates.display, from: start * 1000000 };

  // Style updates
  const styleUpdates: any = {};
  if (fontSize !== undefined) styleUpdates.fontSize = fontSize;
  if (fontFamily !== undefined) styleUpdates.fontFamily = fontFamily;
  if (fill !== undefined) styleUpdates.fill = fill;
  if (opacity !== undefined) styleUpdates.opacity = opacity;

  if (Object.keys(styleUpdates).length > 0) {
    updates.style = styleUpdates;
  }

  if (volume !== undefined) updates.volume = volume;
  if (playbackRate !== undefined) updates.playbackRate = playbackRate;

  core.clip.update(id, updates);
};

export const handleRemoveClip = async (input: any) => {
  const id = input.targetId || input.clipId;
  if (id) {
    core.clip.remove([id]);
  }
};

export const handleSplitClip = async (input: any) => {
  const id = input.targetId || input.clipId;
  const splitTime = input.time || projectStore.getState().currentTime / 1_000_000;
  const clip = projectStore.getState().clips[id];

  if (clip && splitTime) {
    await splitClip(id, splitTime);
  }
};

export const handleTrimClip = async (input: any) => {
  const id = input.targetId || input.clipId;
  const clip = projectStore.getState().clips[id];
  if (clip) {
    await trimClip(id, { from: input.trimFrom, to: 0 }, { from: 0, to: 0 });
  }
};

export const handleAddTransition = async (input: any) => {
  const { fromId, toId, transitionType } = input;
  if (fromId && toId && transitionType) {
    await core.clip.add({
      type: "transition",
      name: transitionType || "GridFlip",
      duration: 2_000_000,
      metadata: { fromId, toId },
    } as any);
  }
};

export const handleAddEffect = async (input: any) => {
  const from = input.from ?? 0;
  const to = input.to ? (input.to - from < 1 ? 1 : input.to) : from + 5;

  await core.clip.add({
    type: "Effect",
    name: input.effectName,
    display: {
      from: from * 1_000_000,
      to: to * 1_000_000,
    },
    duration: (to - from) * 1_000_000,
  });
};

export const handleDuplicateClip = async (input: any) => {
  const id = input.targetId || input.clipId;
  const clip = projectStore.getState().clips[id];
  if (clip) {
    await duplicateClip(id);
  }
};

export const handleSearchAndAddMedia = async (input: any) => {
  const { query, type, targetId, from: fromTime } = input;
  const from = fromTime ?? projectStore.getState().currentTime / 1_000_000;
  try {
    const response = await fetch(
      `/api/pexels?query=${encodeURIComponent(query)}&type=${type || "video"}`,
    );
    const data = await response.json();

    if (type === "image") {
      const photo = data.photos?.[0];
      if (!photo) return;

      await core.clip.add({
        id: targetId || `clip_${Date.now()}`,
        type: "Image",
        name: query ? `${query} (Image)` : "Image clip",
        src: photo.src?.large || photo.src?.original,
        width: photo.width,
        height: photo.height,
        display: {
          from: from * 1_000_000,
          to: (from + 5) * 1_000_000,
        },
        duration: 5_000_000,
        metadata: {
          previewUrl: photo.src?.medium || photo.src?.small,
        },
      });
    } else {
      const video = data.videos?.[0];
      if (!video) return;

      const videoFile =
        video.video_files.find((f: any) => f.quality === "hd") || video.video_files[0];
      if (!videoFile) return;

      const durationUs = (video.duration || 5) * 1_000_000;

      await core.clip.add(
        {
          id: targetId || `clip_${Date.now()}`,
          type: "Video",
          name: query ? `${query} (Video)` : "Video clip",
          src: videoFile.link,
          width: video.width,
          height: video.height,
          display: {
            from: from * 1_000_000,
            to: from * 1_000_000 + durationUs,
          },
          trim: { from: 0, to: durationUs },
          metadata: {
            previewUrl: video.image,
          },
        },
        { objectFit: "contain" },
      );
    }
  } catch (error) {
    console.error("Failed to search and add media:", error);
  }
};

export const handleGenerateVoiceover = async (input: any) => {
  const { text, voiceId, targetId, from: fromTime } = input;
  const from = fromTime ?? projectStore.getState().currentTime / 1_000_000;

  const response = await fetch("/api/elevenlabs/voiceover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Voiceover API failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.url) {
    throw new Error("Voiceover generated but no audio URL returned");
  }

  await core.clip.add({
    id: targetId || `clip_${Date.now()}`,
    type: "Audio",
    name: text ? `Voiceover: "${text}"` : "Audio clip",
    src: data.url,
    display: {
      from: from * 1_000_000,
      to: (from + 5) * 1_000_000,
    },
    duration: 5_000_000,
  });
};

export const handleSeekToTime = async (input: any) => {
  const { time } = input;
  core.seek(time * 1000000);
};

export const handleGenerateCaptions = async (input: any) => {
  const { clipIds } = input;
  const clips = projectStore.getState().clips;
  const targetIds =
    clipIds ||
    Object.keys(clips).filter((id) => clips[id].type === "Video" || clips[id].type === "Audio");

  try {
    const fontName = "Bangers-Regular";
    const fontUrl = "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf";

    await fontManager.addFont({ name: fontName, url: fontUrl });

    const clipsToAdd: any[] = [];

    for (const id of targetIds) {
      const clip = clips[id];
      if (!clip || !clip.src) continue;

      try {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: clip.src }),
        });
        const data = await response.json();
        const words = data.results?.main?.words || data.words || [];

        if (words.length > 0) {
          const captionClipsJSON = await generateCaptionClips({
            videoWidth: projectStore.getState().settings.width,
            videoHeight: projectStore.getState().settings.height,
            words,
          });

          for (const json of captionClipsJSON) {
            clipsToAdd.push({
              ...json,
              mediaId: clip.id,
              display: {
                from: json.display.from + clip.display.from,
                to: json.display.to + clip.display.from,
              },
            });
          }
        }
      } catch (error) {
        console.error(`Failed to generate captions for clip ${id}:`, error);
      }
    }

    if (clipsToAdd.length > 0) {
      const fullClips = await Promise.all(clipsToAdd.map((clip) => core.clip.prepare(clip)));
      const commands = fullClips.map((clip) => ({
        id: nanoid(),
        type: "clip.add",
        payload: { clip },
      }));
      core.batch(commands as any);
    }
  } catch (error) {
    console.error("Failed to generate captions:", error);
  }
};
