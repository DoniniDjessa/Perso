import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { MediaAttach } from '@/components/MediaAttach'
import { LinksAttach } from '@/components/LinksAttach'
import { PeopleAttach } from '@/components/PeopleAttach'
import { PlaceAttach } from '@/components/PlaceAttach'
import { OptionalDateTime, resolveSpentAt } from '@/components/OptionalDateTime'
import { mapColumns, mapPointFrom, type MapPoint } from '@/lib/maps'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemFile, persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { asLinkList, normalizeLinks } from '@/lib/links'
import { insertRow, peoplePayload, updateRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { useItemMedia } from '@/lib/useItemMedia'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import type { AssignedPerson, HistoryProof } from '@/lib/types'
import { useState } from 'react'
import { Text } from 'tamagui'

export function HistoryForm({
  item,
  onClose,
  onSaved,
}: {
  item?: HistoryProof | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const editing = Boolean(item?.id)
  const proof = dateAndTimeFromIso(item?.proof_at)
  const [title, setTitle] = useState(item?.title ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [date, setDate] = useState<Date | null>(proof.date)
  const [time, setTime] = useState<Date | null>(proof.time)
  const image = useItemImage(item?.image_path)
  const video = useItemMedia(item?.video_path)
  const audio = useItemMedia(item?.audio_path)
  const [links, setLinks] = useState<string[]>(asLinkList(item?.links).length ? asLinkList(item?.links) : [''])
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(item ? mapPointFrom(item) : null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user) return
    if (!title.trim()) {
      setError('Le titre est requis.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        title: title.trim(),
        notes: notes.trim() || null,
        proof_at: resolveSpentAt(date, time).toISOString(),
        people: peoplePayload(people),
        links: normalizeLinks(links),
        ...mapColumns(mapPoint),
      }

      if (editing && item) {
        const image_path = await persistItemImage(
          user.id,
          item.id,
          item.image_path,
          image.uri,
          image.dirty
        )
        const video_path = await persistItemFile(
          user.id,
          item.id,
          item.video_path,
          video.file,
          video.dirty,
          'mp4',
          'video/mp4'
        )
        const audio_path = await persistItemFile(
          user.id,
          item.id,
          item.audio_path,
          audio.file,
          audio.dirty,
          'm4a',
          'audio/mp4'
        )
        await updateRow(tables.history, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
          ...(video_path !== undefined ? { video_path } : {}),
          ...(audio_path !== undefined ? { audio_path } : {}),
        })
        onSaved()
        return
      }

      const data = await insertRow(tables.history, { user_id: user.id, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      const video_path = await persistItemFile(
        user.id,
        data.id,
        null,
        video.file,
        Boolean(video.file && typeof video.file !== 'string'),
        'mp4',
        'video/mp4'
      )
      const audio_path = await persistItemFile(
        user.id,
        data.id,
        null,
        audio.file,
        Boolean(audio.file && typeof audio.file !== 'string'),
        'm4a',
        'audio/mp4'
      )
      await updateRow(tables.history, data.id, {
        ...(image_path ? { image_path } : {}),
        ...(video_path ? { video_path } : {}),
        ...(audio_path ? { audio_path } : {}),
      })
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    setBusy(true)
    try {
      const { error: err } = await supabase.from(tables.history).delete().eq('id', item.id)
      if (err) throw err
      onSaved()
    } catch (e) {
      setError(errorMessage(e, 'Suppression impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPanel
      title={editing ? 'Modifier la preuve' : 'Nouvelle preuve'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!title}
    >
      <Field
        label="TITRE"
        placeholder="Ex. reçu, contrat, capture…"
        value={title}
        onChangeText={setTitle}
      />
      <OptionalDateTime
        date={date}
        time={time}
        onDate={setDate}
        onTime={setTime}
        dateLabel="DATE DE LA PREUVE"
        timeLabel="HEURE (OPTIONNEL)"
        emptyDate="Aujourd’hui"
        emptyTime="Maintenant"
      />
      <Field
        label="NOTES"
        placeholder="Détail optionnel"
        value={notes}
        onChangeText={setNotes}
      />
      <PeopleAttach people={people} onChange={setPeople} />
      <PlaceAttach point={mapPoint} onChange={setMapPoint} />
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      <MediaAttach kind="video" uri={video.uri} label={video.label} onChange={video.onChange} />
      <MediaAttach kind="audio" uri={audio.uri} label={audio.label} onChange={audio.onChange} />
      <LinksAttach links={links} onChange={setLinks} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
