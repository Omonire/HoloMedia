import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, authSession, timeAgo, splitContent, type Post, type User } from '@holomedia/shared';
import { colors } from '../theme';

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

function PostCard({ post }: { post: Post }) {
  const original = post.repost_of ?? post;
  return (
    <View style={styles.post}>
      <View style={styles.postHead}>
        <Avatar name={original.author.full_name} color={original.author.avatar_color} />
        <View style={styles.postMeta}>
          <Text style={styles.postName} numberOfLines={1}>
            {original.author.full_name}
          </Text>
          <Text style={styles.postUser}>
            @{original.author.username} · {timeAgo(original.created_at)}
          </Text>
        </View>
      </View>
      <Text style={styles.postContent}>
        {splitContent(original.content).map((part, i) =>
          part.isTag ? (
            <Text key={i} style={styles.tag}>
              {part.text}
            </Text>
          ) : (
            part.text
          ),
        )}
      </Text>
      {original.image_url ? <Text style={styles.mediaHint}>🖼 Image post</Text> : null}
      {original.video_url ? <Text style={styles.mediaHint}>🎬 Reel</Text> : null}
      <View style={styles.postActions}>
        <Text style={styles.actionCount}>❤️ {original.likes_count}</Text>
        <Text style={styles.actionCount}>💬 {original.comments_count}</Text>
        <Text style={styles.actionCount}>🔁 {original.reposts_count}</Text>
        <Text style={styles.actionCount}>🔖 {original.bookmarks_count}</Text>
      </View>
    </View>
  );
}

export function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const me = authSession.user;

  const load = useCallback(() => {
    api
      .get<{ posts: Post[] }>('/posts/feed')
      .then((r) => setPosts(r.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function publish() {
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const r = await api.post<{ post: Post }>('/posts/', { content: draft.trim() });
      setPosts((prev) => [r.post, ...prev]);
      setDraft('');
    } catch {
      /* ignore */
    } finally {
      setPosting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity
          onPress={() => void authSession.logout()}
          style={styles.logout}
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.composer}>
        <View style={styles.composerRow}>
          {me ? <Avatar name={me.full_name} color={me.avatar_color} size={36} /> : null}
          <TextInput
            style={styles.composerInput}
            placeholder={`What's happening, ${me?.full_name.split(' ')[0] ?? ''}?`}
            placeholderTextColor={colors.textDim}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
        </View>
        <TouchableOpacity
          style={[styles.postBtn, (posting || !draft.trim()) && styles.btnDisabled]}
          onPress={publish}
          disabled={posting || !draft.trim()}
        >
          {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Your feed is quiet. Follow people to see their posts here.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  logout: { padding: 6 },
  logoutText: { color: colors.textDim, fontSize: 14 },
  composer: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  composerRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  composerInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 22,
  },
  btnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  post: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  postHead: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  postMeta: { flex: 1 },
  postName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  postUser: { color: colors.textDim, fontSize: 13 },
  postContent: { color: colors.text, fontSize: 15.5, lineHeight: 23, marginBottom: 12 },
  tag: { color: colors.accent, fontWeight: '600' },
  mediaHint: { color: colors.textDim, fontSize: 13, marginBottom: 8 },
  postActions: { flexDirection: 'row', gap: 14, marginTop: 4 },
  actionCount: { color: colors.textDim, fontSize: 13 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 40, fontSize: 15 },
});
