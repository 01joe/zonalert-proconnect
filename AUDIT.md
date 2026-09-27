# AUDIT FRONTEND ↔ BACKEND

## ❌ Problèmes identifiés

1. **Comment.userName** : Le frontend utilise `c.userName` dans incident-detail
   → Le backend renvoie user.firstName+lastName, mais pas `userName` dans Comment
   
2. **GET /incidents** : Le frontend lit `res.data ?? res` (supporte les deux formats)
   → OK - backend renvoie PaginatedResponse avec data[]

3. **GET /professionals** : Le frontend calcule distance côté client via Haversine
   → distance est un champ optionnel dans Professional - OK côté backend
   
4. **Profile page** : appelle srService.getByUser(user.id) → GET /service-requests/user/:id
   → OK dans backend

5. **Notifications** : markRead appelle PATCH /notifications/:id/read
   → ⚠️ Route dans controller : @Patch(':id/read') — conflit potentiel avec 'read-all'
   → NestJS résout dans l'ordre, mais 'read-all' doit être avant ':id/read'
   
6. **Comment response** : frontend attend { id, content, userId, userName, incidentId, createdAt }
   → Backend renvoie Comment entity sans userName (c'est firstName+lastName du user)
   → Besoin d'un CommentResponseDto avec userName calculé

7. **Auth response** : frontend attend { access_token, user } directement (sans wrapper)
   → TransformInterceptor supprimé - OK maintenant

8. **Error interceptor** : lit error.error.message (string ou array)
   → AllExceptionsFilter renvoie bien { statusCode, error, message } - OK

9. **Professional.distance** : field optionnel attendu dans l'interface frontend
   → Backend ne calcule pas distance dans réponse, frontend le calcule - OK
   
10. **UserRole enum** : frontend utilise 'citizen' mais backend enum = CITIZEN = 'citizen' - OK
