'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage, LanguageSwitch } from '@/lib/i18n'

const TOTAL_LEARNING = 31
const QUIZ_LENGTH = 20
type QuizQuestion = { q: string; opts: string[]; correct: number; correctExpl: string; wrongExpl: string }
const QUIZ_SETS: QuizQuestion[][] = [
  [
    { q: `Dans l’informatique traditionnelle, quelle phrase décrit le mieux le rôle de l’humain ?`, opts: [`Il écrit les règles à appliquer`, `Il laisse la machine inventer ses objectifs`, `Il fournit seulement des exemples`, `Il choisit les poids du réseau`], correct: 0, correctExpl: `L’informatique traditionnelle suit des instructions explicites conçues par des humains. C’est ce qui rend de nombreux traitements déterministes et auditables.`, wrongExpl: `La notion clé est « règles explicites ». Le système n’apprend pas seul ses paramètres à partir d’exemples : il exécute une procédure conçue à l’avance.` },
    { q: `Pourquoi l’exemple du chat sous forme d’arbre de décision est-il utile ?`, opts: [`Il prouve que tout logiciel est un arbre`, `Il illustre des conditions écrites à l’avance`, `Il décrit un réseau neuronal moderne`, `Il explique la tokenisation`], correct: 1, correctExpl: `L’arbre est une simplification pédagogique : il montre comment une succession de conditions explicites peut conduire à une classification.`, wrongExpl: `Attention à l’analogie : le chat sert à visualiser des règles explicites. Cela ne signifie pas que tous les logiciels prennent réellement la forme d’un arbre de décision.` },
    { q: `Que faut-il retenir du 0 et du 1 ?`, opts: [`Ils sont les deux réponses d’un LLM`, `Ils remplacent les algorithmes`, `Ils représentent des états binaires de l’informatique numérique`, `Ils correspondent toujours à oui et non`], correct: 2, correctExpl: `Le binaire représente deux états logiques. L’image « courant / pas de courant » aide à comprendre, mais elle simplifie le fonctionnement électronique réel.`, wrongExpl: `Ne confonds pas deux niveaux : le binaire concerne la représentation et le calcul numériques ; un arbre oui/non est une manière possible d’organiser une décision.` },
    { q: `Quel trio décrit un système expert classique ?`, opts: [`Tokens, vecteurs, attention`, `Données, GPU, Internet`, `Prompt, réponse, mémoire`, `Faits, règles, moteur d’inférence`], correct: 3, correctExpl: `Un système expert exploite des faits et des règles grâce à un moteur d’inférence pour produire des conclusions dans un domaine défini.`, wrongExpl: `Reviens au schéma central du module : FAITS + RÈGLES → MOTEUR D’INFÉRENCE → CONCLUSION. Les autres propositions appartiennent à d’autres générations de systèmes.` },
    { q: `Pourquoi Deep Blue est-il présenté dans le module ?`, opts: [`Pour illustrer une spécialisation très forte`, `Parce qu’il était un LLM`, `Pour montrer la génération d’images`, `Parce qu’il savait apprendre n’importe quelle tâche`], correct: 0, correctExpl: `Deep Blue illustre la puissance d’un système spécialisé : excellent aux échecs, mais pas doté d’une intelligence générale. Il n’était toutefois pas un système expert classique au sens strict.`, wrongExpl: `Le piège consiste à confondre performance et généralité. Être exceptionnel sur une tâche ne signifie pas savoir transférer cette compétence à n’importe quel autre domaine.` },
    { q: `Dans l’analogie de la recette, que représente surtout l’algorithme ?`, opts: [`Une base de données`, `Une procédure structurée`, `Un réseau biologique`, `Un résultat aléatoire`], correct: 1, correctExpl: `Une recette est une bonne analogie d’un algorithme parce qu’elle décrit une suite d’opérations permettant d’atteindre un résultat.`, wrongExpl: `L’analogie ne doit pas être prise au pied de la lettre : un algorithme est une procédure formelle et structurée, pas nécessairement une liste de recettes ou de règles métier.` },
    { q: `Quelle rupture pédagogique introduit le machine learning ?`, opts: [`La disparition des données`, `L’abandon du calcul numérique`, `L’apprentissage de paramètres à partir d’exemples`, `La suppression des objectifs`], correct: 2, correctExpl: `Au lieu d’écrire toutes les règles de reconnaissance, on fournit notamment des données, une architecture et un objectif ; l’entraînement ajuste les paramètres du modèle.`, wrongExpl: `Le machine learning n’élimine ni les algorithmes ni les objectifs. Ce qui change, c’est qu’une partie du comportement est apprise à partir des données plutôt que codée règle par règle.` },
    { q: `Dans un réseau neuronal, qu’est-ce qu’un poids ?`, opts: [`La taille du fichier`, `Le nombre de couches`, `Une image d’entraînement`, `Une valeur réglant l’influence d’une connexion`], correct: 3, correctExpl: `Un poids est un paramètre numérique. Pendant l’entraînement, son ajustement modifie l’influence de certains signaux sur les calculs suivants.`, wrongExpl: `L’image du bouton de volume sert ici : on ne tourne pas physiquement un neurone. L’apprentissage ajuste des valeurs numériques, notamment les poids des connexions.` },
    { q: `Que signifie généraliser pour un modèle entraîné à reconnaître des chats ?`, opts: [`Reconnaître aussi des chats jamais vus`, `Mémoriser exactement chaque image`, `Répondre toujours « chat »`, `Créer automatiquement une règle écrite`], correct: 0, correctExpl: `La généralisation est la capacité à réussir sur de nouveaux exemples : autre couleur, autre angle, autre éclairage, etc.`, wrongExpl: `Mémoriser le jeu d’entraînement ne suffit pas. Un modèle utile doit transférer ce qu’il a appris à des situations nouvelles mais suffisamment proches du problème appris.` },
    { q: `Quel est le rôle de la rétropropagation ?`, opts: [`Choisir le prompt`, `Calculer comment l’erreur dépend des paramètres`, `Créer les données`, `Transformer les règles en faits`], correct: 1, correctExpl: `La rétropropagation calcule efficacement comment les paramètres contribuent à l’erreur ; un optimiseur peut ensuite les ajuster pour réduire cette erreur.`, wrongExpl: `Ne la confonds pas avec l’ensemble de l’apprentissage. La rétropropagation fournit l’information nécessaire aux ajustements ; la descente de gradient ou un optimiseur utilise ensuite cette information.` },
    { q: `Pourquoi parle-t-on de « boîte noire » ?`, opts: [`Parce que le code est toujours secret`, `Parce que les serveurs sont fermés`, `Parce qu’une décision est difficile à traduire en règles humaines simples`, `Parce que personne ne connaît l’architecture`], correct: 2, correctExpl: `Dans un grand réseau, une sortie résulte de très nombreux paramètres et calculs distribués. On connaît l’architecture, mais expliquer une décision en quelques règles humaines peut être difficile.`, wrongExpl: `« Boîte noire » ne signifie pas « magie » ni « ignorance totale ». On sait construire et entraîner le modèle ; la difficulté concerne surtout l’interprétation fine de ses mécanismes et décisions.` },
    { q: `Qu’est-ce qu’un token dans un LLM ?`, opts: [`Une probabilité`, `Un vecteur complet`, `Une phrase entière`, `Une unité de texte traitée par le modèle`], correct: 3, correctExpl: `Le tokenizer découpe le texte en unités : mots, morceaux de mots, ponctuation ou autres fragments selon le vocabulaire du modèle.`, wrongExpl: `Un token n’est pas forcément un mot. Cette distinction est importante pour comprendre les limites de contexte, les coûts en tokens et la génération séquentielle.` },
    { q: `Dans « Bonjour, comment ça… », que fait le modèle avant de produire la suite ?`, opts: [`Il estime des probabilités sur les tokens suivants`, `Il recherche une phrase identique sur Internet`, `Il applique une règle grammaticale unique`, `Il choisit le mot le plus long`], correct: 0, correctExpl: `À partir du contexte, le modèle produit une distribution de probabilités sur les tokens possibles, puis le mécanisme de génération sélectionne la suite.`, wrongExpl: `Le modèle ne se contente ni d’une recherche exacte ni d’une règle unique. Sa prédiction dépend du contexte et des régularités apprises pendant l’entraînement.` },
    { q: `À quoi sert surtout l’expérience du sac de billes ?`, opts: [`À simuler le stockage`, `À rendre intuitive l’idée de probabilité conditionnelle`, `À expliquer les GPU`, `À représenter les embeddings`], correct: 1, correctExpl: `Les tirages successifs montrent comment de nouvelles observations peuvent modifier notre estimation. C’est une analogie pour introduire l’intuition probabiliste.`, wrongExpl: `Les tokens ne sont pas réellement mélangés dans un sac. L’expérience sert uniquement à donner une intuition de la mise à jour d’une estimation en fonction d’informations disponibles.` },
    { q: `Pourquoi le lapin en peluche et le lapin du chasseur donnent-ils des réponses différentes ?`, opts: [`Parce que le mot change d’orthographe`, `Parce que l’IA reconnaît le métier automatiquement`, `Parce que le contexte oriente l’interprétation`, `Parce que chaque sens possède un LLM différent`], correct: 2, correctExpl: `La même chaîne de mots peut prendre un sens différent selon son contexte. Les représentations et le mécanisme d’attention permettent au modèle d’exploiter ces relations.`, wrongExpl: `Le mot « lapin » reste identique. Ce sont les autres éléments du contexte — enfant, peluche, chasse, cuisine — qui orientent l’interprétation pertinente.` },
    { q: `Comment peut-on vulgariser un vecteur dans ce module ?`, opts: [`Comme une règle SI/ALORS`, `Comme une base de faits`, `Comme une liste de sites web`, `Comme des coordonnées sur une carte mathématique du sens`], correct: 3, correctExpl: `Un vecteur est une suite de nombres. L’image d’une carte multidimensionnelle aide à comprendre que des représentations peuvent encoder des relations apprises.`, wrongExpl: `Il ne faut pas imaginer un rayon nommé « doudou » ou « recette ». Les dimensions sont apprises et leur interprétation n’est généralement pas aussi directe.` },
    { q: `Que signifie le T de GPT ?`, opts: [`Transformer`, `Token`, `Training`, `Technology`], correct: 0, correctExpl: `GPT signifie Generative Pre-trained Transformer. Le Transformer est une architecture introduite en 2017 et fondée notamment sur des mécanismes d’attention.`, wrongExpl: `Le token est une unité de texte, et l’entraînement est une phase du développement du modèle, mais le T de l’acronyme GPT signifie bien Transformer.` },
    { q: `Quel est le rôle intuitif de l’attention ?`, opts: [`Compresser les fichiers`, `Relier les éléments du contexte qui comptent pour le traitement`, `Créer les comptes utilisateurs`, `Mesurer la puissance du GPU`], correct: 1, correctExpl: `L’attention calcule des relations entre représentations afin de pondérer les informations pertinentes du contexte pour chaque position traitée.`, wrongExpl: `Dans l’exemple « l’enfant prend son lapin… avec lui », l’attention aide à exploiter les relations entre les mots plutôt que de traiter chaque token comme isolé.` },
    { q: `Qu’est-ce qui distingue surtout un agent IA d’un simple échange de chatbot ?`, opts: [`Il est toujours conscient`, `Il fonctionne sans modèle`, `Il peut enchaîner des actions et utiliser des outils vers un objectif`, `Il n’a besoin d’aucune autorisation`], correct: 2, correctExpl: `Un agent peut recevoir un objectif, choisir ou suivre des étapes, appeler des outils, observer leurs résultats puis poursuivre. Son autonomie reste encadrée par sa conception et ses permissions.`, wrongExpl: `Un agent n’est ni nécessairement autonome à 100 %, ni conscient. La différence utile ici est sa capacité à agir avec des outils et à enchaîner plusieurs étapes.` },
    { q: `Quelle ambition associe-t-on aux world models dans le module ?`, opts: [`Remplacer toutes les interfaces`, `Créer uniquement de la vidéo`, `Prédire seulement le prochain mot`, `Apprendre des représentations permettant d’anticiper l’évolution d’un environnement`], correct: 3, correctExpl: `Les world models cherchent notamment à représenter des dynamiques du monde : états, évolution, conséquences possibles d’actions, espace ou temporalité.`, wrongExpl: `L’enjeu va au-delà de la multimodalité ou du prochain token : il s’agit d’apprendre des représentations utiles pour anticiper ce qui pourrait se passer dans un environnement.` },
  ],
  [
    { q: `Vérifions la notion : dans l’informatique traditionnelle, quelle phrase décrit le mieux le rôle de l’humain ?`, opts: [`Il laisse la machine inventer ses objectifs`, `Il fournit seulement des exemples`, `Il choisit les poids du réseau`, `Il écrit les règles à appliquer`], correct: 3, correctExpl: `L’informatique traditionnelle suit des instructions explicites conçues par des humains. C’est ce qui rend de nombreux traitements déterministes et auditables.`, wrongExpl: `La notion clé est « règles explicites ». Le système n’apprend pas seul ses paramètres à partir d’exemples : il exécute une procédure conçue à l’avance.` },
    { q: `Dans le schéma étudié : pourquoi l’exemple du chat sous forme d’arbre de décision est-il utile ?`, opts: [`Il décrit un réseau neuronal moderne`, `Il explique la tokenisation`, `Il prouve que tout logiciel est un arbre`, `Il illustre des conditions écrites à l’avance`], correct: 3, correctExpl: `L’arbre est une simplification pédagogique : il montre comment une succession de conditions explicites peut conduire à une classification.`, wrongExpl: `Attention à l’analogie : le chat sert à visualiser des règles explicites. Cela ne signifie pas que tous les logiciels prennent réellement la forme d’un arbre de décision.` },
    { q: `Application concrète : que faut-il retenir du 0 et du 1 ?`, opts: [`Ils correspondent toujours à oui et non`, `Ils sont les deux réponses d’un LLM`, `Ils remplacent les algorithmes`, `Ils représentent des états binaires de l’informatique numérique`], correct: 3, correctExpl: `Le binaire représente deux états logiques. L’image « courant / pas de courant » aide à comprendre, mais elle simplifie le fonctionnement électronique réel.`, wrongExpl: `Ne confonds pas deux niveaux : le binaire concerne la représentation et le calcul numériques ; un arbre oui/non est une manière possible d’organiser une décision.` },
    { q: `Mise en situation : quel trio décrit un système expert classique ?`, opts: [`Tokens, vecteurs, attention`, `Données, GPU, Internet`, `Prompt, réponse, mémoire`, `Faits, règles, moteur d’inférence`], correct: 3, correctExpl: `Un système expert exploite des faits et des règles grâce à un moteur d’inférence pour produire des conclusions dans un domaine défini.`, wrongExpl: `Reviens au schéma central du module : FAITS + RÈGLES → MOTEUR D’INFÉRENCE → CONCLUSION. Les autres propositions appartiennent à d’autres générations de systèmes.` },
    { q: `Vérifions la notion : pourquoi Deep Blue est-il présenté dans le module ?`, opts: [`Parce qu’il était un LLM`, `Pour montrer la génération d’images`, `Parce qu’il savait apprendre n’importe quelle tâche`, `Pour illustrer une spécialisation très forte`], correct: 3, correctExpl: `Deep Blue illustre la puissance d’un système spécialisé : excellent aux échecs, mais pas doté d’une intelligence générale. Il n’était toutefois pas un système expert classique au sens strict.`, wrongExpl: `Le piège consiste à confondre performance et généralité. Être exceptionnel sur une tâche ne signifie pas savoir transférer cette compétence à n’importe quel autre domaine.` },
    { q: `Dans le schéma étudié : dans l’analogie de la recette, que représente surtout l’algorithme ?`, opts: [`Un réseau biologique`, `Un résultat aléatoire`, `Une base de données`, `Une procédure structurée`], correct: 3, correctExpl: `Une recette est une bonne analogie d’un algorithme parce qu’elle décrit une suite d’opérations permettant d’atteindre un résultat.`, wrongExpl: `L’analogie ne doit pas être prise au pied de la lettre : un algorithme est une procédure formelle et structurée, pas nécessairement une liste de recettes ou de règles métier.` },
    { q: `Application concrète : quelle rupture pédagogique introduit le machine learning ?`, opts: [`La suppression des objectifs`, `La disparition des données`, `L’abandon du calcul numérique`, `L’apprentissage de paramètres à partir d’exemples`], correct: 3, correctExpl: `Au lieu d’écrire toutes les règles de reconnaissance, on fournit notamment des données, une architecture et un objectif ; l’entraînement ajuste les paramètres du modèle.`, wrongExpl: `Le machine learning n’élimine ni les algorithmes ni les objectifs. Ce qui change, c’est qu’une partie du comportement est apprise à partir des données plutôt que codée règle par règle.` },
    { q: `Mise en situation : dans un réseau neuronal, qu’est-ce qu’un poids ?`, opts: [`La taille du fichier`, `Le nombre de couches`, `Une image d’entraînement`, `Une valeur réglant l’influence d’une connexion`], correct: 3, correctExpl: `Un poids est un paramètre numérique. Pendant l’entraînement, son ajustement modifie l’influence de certains signaux sur les calculs suivants.`, wrongExpl: `L’image du bouton de volume sert ici : on ne tourne pas physiquement un neurone. L’apprentissage ajuste des valeurs numériques, notamment les poids des connexions.` },
    { q: `Vérifions la notion : que signifie généraliser pour un modèle entraîné à reconnaître des chats ?`, opts: [`Mémoriser exactement chaque image`, `Répondre toujours « chat »`, `Créer automatiquement une règle écrite`, `Reconnaître aussi des chats jamais vus`], correct: 3, correctExpl: `La généralisation est la capacité à réussir sur de nouveaux exemples : autre couleur, autre angle, autre éclairage, etc.`, wrongExpl: `Mémoriser le jeu d’entraînement ne suffit pas. Un modèle utile doit transférer ce qu’il a appris à des situations nouvelles mais suffisamment proches du problème appris.` },
    { q: `Dans le schéma étudié : quel est le rôle de la rétropropagation ?`, opts: [`Créer les données`, `Transformer les règles en faits`, `Choisir le prompt`, `Calculer comment l’erreur dépend des paramètres`], correct: 3, correctExpl: `La rétropropagation calcule efficacement comment les paramètres contribuent à l’erreur ; un optimiseur peut ensuite les ajuster pour réduire cette erreur.`, wrongExpl: `Ne la confonds pas avec l’ensemble de l’apprentissage. La rétropropagation fournit l’information nécessaire aux ajustements ; la descente de gradient ou un optimiseur utilise ensuite cette information.` },
    { q: `Application concrète : pourquoi parle-t-on de « boîte noire » ?`, opts: [`Parce que personne ne connaît l’architecture`, `Parce que le code est toujours secret`, `Parce que les serveurs sont fermés`, `Parce qu’une décision est difficile à traduire en règles humaines simples`], correct: 3, correctExpl: `Dans un grand réseau, une sortie résulte de très nombreux paramètres et calculs distribués. On connaît l’architecture, mais expliquer une décision en quelques règles humaines peut être difficile.`, wrongExpl: `« Boîte noire » ne signifie pas « magie » ni « ignorance totale ». On sait construire et entraîner le modèle ; la difficulté concerne surtout l’interprétation fine de ses mécanismes et décisions.` },
    { q: `Mise en situation : qu’est-ce qu’un token dans un LLM ?`, opts: [`Une probabilité`, `Un vecteur complet`, `Une phrase entière`, `Une unité de texte traitée par le modèle`], correct: 3, correctExpl: `Le tokenizer découpe le texte en unités : mots, morceaux de mots, ponctuation ou autres fragments selon le vocabulaire du modèle.`, wrongExpl: `Un token n’est pas forcément un mot. Cette distinction est importante pour comprendre les limites de contexte, les coûts en tokens et la génération séquentielle.` },
    { q: `Vérifions la notion : dans « Bonjour, comment ça… », que fait le modèle avant de produire la suite ?`, opts: [`Il recherche une phrase identique sur Internet`, `Il applique une règle grammaticale unique`, `Il choisit le mot le plus long`, `Il estime des probabilités sur les tokens suivants`], correct: 3, correctExpl: `À partir du contexte, le modèle produit une distribution de probabilités sur les tokens possibles, puis le mécanisme de génération sélectionne la suite.`, wrongExpl: `Le modèle ne se contente ni d’une recherche exacte ni d’une règle unique. Sa prédiction dépend du contexte et des régularités apprises pendant l’entraînement.` },
    { q: `Dans le schéma étudié : à quoi sert surtout l’expérience du sac de billes ?`, opts: [`À expliquer les GPU`, `À représenter les embeddings`, `À simuler le stockage`, `À rendre intuitive l’idée de probabilité conditionnelle`], correct: 3, correctExpl: `Les tirages successifs montrent comment de nouvelles observations peuvent modifier notre estimation. C’est une analogie pour introduire l’intuition probabiliste.`, wrongExpl: `Les tokens ne sont pas réellement mélangés dans un sac. L’expérience sert uniquement à donner une intuition de la mise à jour d’une estimation en fonction d’informations disponibles.` },
    { q: `Application concrète : pourquoi le lapin en peluche et le lapin du chasseur donnent-ils des réponses différentes ?`, opts: [`Parce que chaque sens possède un LLM différent`, `Parce que le mot change d’orthographe`, `Parce que l’IA reconnaît le métier automatiquement`, `Parce que le contexte oriente l’interprétation`], correct: 3, correctExpl: `La même chaîne de mots peut prendre un sens différent selon son contexte. Les représentations et le mécanisme d’attention permettent au modèle d’exploiter ces relations.`, wrongExpl: `Le mot « lapin » reste identique. Ce sont les autres éléments du contexte — enfant, peluche, chasse, cuisine — qui orientent l’interprétation pertinente.` },
    { q: `Mise en situation : comment peut-on vulgariser un vecteur dans ce module ?`, opts: [`Comme une règle SI/ALORS`, `Comme une base de faits`, `Comme une liste de sites web`, `Comme des coordonnées sur une carte mathématique du sens`], correct: 3, correctExpl: `Un vecteur est une suite de nombres. L’image d’une carte multidimensionnelle aide à comprendre que des représentations peuvent encoder des relations apprises.`, wrongExpl: `Il ne faut pas imaginer un rayon nommé « doudou » ou « recette ». Les dimensions sont apprises et leur interprétation n’est généralement pas aussi directe.` },
    { q: `Vérifions la notion : que signifie le T de GPT ?`, opts: [`Token`, `Training`, `Technology`, `Transformer`], correct: 3, correctExpl: `GPT signifie Generative Pre-trained Transformer. Le Transformer est une architecture introduite en 2017 et fondée notamment sur des mécanismes d’attention.`, wrongExpl: `Le token est une unité de texte, et l’entraînement est une phase du développement du modèle, mais le T de l’acronyme GPT signifie bien Transformer.` },
    { q: `Dans le schéma étudié : quel est le rôle intuitif de l’attention ?`, opts: [`Créer les comptes utilisateurs`, `Mesurer la puissance du GPU`, `Compresser les fichiers`, `Relier les éléments du contexte qui comptent pour le traitement`], correct: 3, correctExpl: `L’attention calcule des relations entre représentations afin de pondérer les informations pertinentes du contexte pour chaque position traitée.`, wrongExpl: `Dans l’exemple « l’enfant prend son lapin… avec lui », l’attention aide à exploiter les relations entre les mots plutôt que de traiter chaque token comme isolé.` },
    { q: `Application concrète : qu’est-ce qui distingue surtout un agent IA d’un simple échange de chatbot ?`, opts: [`Il n’a besoin d’aucune autorisation`, `Il est toujours conscient`, `Il fonctionne sans modèle`, `Il peut enchaîner des actions et utiliser des outils vers un objectif`], correct: 3, correctExpl: `Un agent peut recevoir un objectif, choisir ou suivre des étapes, appeler des outils, observer leurs résultats puis poursuivre. Son autonomie reste encadrée par sa conception et ses permissions.`, wrongExpl: `Un agent n’est ni nécessairement autonome à 100 %, ni conscient. La différence utile ici est sa capacité à agir avec des outils et à enchaîner plusieurs étapes.` },
    { q: `Mise en situation : quelle ambition associe-t-on aux world models dans le module ?`, opts: [`Remplacer toutes les interfaces`, `Créer uniquement de la vidéo`, `Prédire seulement le prochain mot`, `Apprendre des représentations permettant d’anticiper l’évolution d’un environnement`], correct: 3, correctExpl: `Les world models cherchent notamment à représenter des dynamiques du monde : états, évolution, conséquences possibles d’actions, espace ou temporalité.`, wrongExpl: `L’enjeu va au-delà de la multimodalité ou du prochain token : il s’agit d’apprendre des représentations utiles pour anticiper ce qui pourrait se passer dans un environnement.` },
  ],
  [
    { q: `Dans le schéma étudié : dans l’informatique traditionnelle, quelle phrase décrit le mieux le rôle de l’humain ?`, opts: [`Il fournit seulement des exemples`, `Il choisit les poids du réseau`, `Il écrit les règles à appliquer`, `Il laisse la machine inventer ses objectifs`], correct: 2, correctExpl: `L’informatique traditionnelle suit des instructions explicites conçues par des humains. C’est ce qui rend de nombreux traitements déterministes et auditables.`, wrongExpl: `La notion clé est « règles explicites ». Le système n’apprend pas seul ses paramètres à partir d’exemples : il exécute une procédure conçue à l’avance.` },
    { q: `Application concrète : pourquoi l’exemple du chat sous forme d’arbre de décision est-il utile ?`, opts: [`Il explique la tokenisation`, `Il prouve que tout logiciel est un arbre`, `Il illustre des conditions écrites à l’avance`, `Il décrit un réseau neuronal moderne`], correct: 2, correctExpl: `L’arbre est une simplification pédagogique : il montre comment une succession de conditions explicites peut conduire à une classification.`, wrongExpl: `Attention à l’analogie : le chat sert à visualiser des règles explicites. Cela ne signifie pas que tous les logiciels prennent réellement la forme d’un arbre de décision.` },
    { q: `Mise en situation : que faut-il retenir du 0 et du 1 ?`, opts: [`Ils sont les deux réponses d’un LLM`, `Ils remplacent les algorithmes`, `Ils représentent des états binaires de l’informatique numérique`, `Ils correspondent toujours à oui et non`], correct: 2, correctExpl: `Le binaire représente deux états logiques. L’image « courant / pas de courant » aide à comprendre, mais elle simplifie le fonctionnement électronique réel.`, wrongExpl: `Ne confonds pas deux niveaux : le binaire concerne la représentation et le calcul numériques ; un arbre oui/non est une manière possible d’organiser une décision.` },
    { q: `Vérifions la notion : quel trio décrit un système expert classique ?`, opts: [`Données, GPU, Internet`, `Prompt, réponse, mémoire`, `Faits, règles, moteur d’inférence`, `Tokens, vecteurs, attention`], correct: 2, correctExpl: `Un système expert exploite des faits et des règles grâce à un moteur d’inférence pour produire des conclusions dans un domaine défini.`, wrongExpl: `Reviens au schéma central du module : FAITS + RÈGLES → MOTEUR D’INFÉRENCE → CONCLUSION. Les autres propositions appartiennent à d’autres générations de systèmes.` },
    { q: `Dans le schéma étudié : pourquoi Deep Blue est-il présenté dans le module ?`, opts: [`Pour montrer la génération d’images`, `Parce qu’il savait apprendre n’importe quelle tâche`, `Pour illustrer une spécialisation très forte`, `Parce qu’il était un LLM`], correct: 2, correctExpl: `Deep Blue illustre la puissance d’un système spécialisé : excellent aux échecs, mais pas doté d’une intelligence générale. Il n’était toutefois pas un système expert classique au sens strict.`, wrongExpl: `Le piège consiste à confondre performance et généralité. Être exceptionnel sur une tâche ne signifie pas savoir transférer cette compétence à n’importe quel autre domaine.` },
    { q: `Application concrète : dans l’analogie de la recette, que représente surtout l’algorithme ?`, opts: [`Un résultat aléatoire`, `Une base de données`, `Une procédure structurée`, `Un réseau biologique`], correct: 2, correctExpl: `Une recette est une bonne analogie d’un algorithme parce qu’elle décrit une suite d’opérations permettant d’atteindre un résultat.`, wrongExpl: `L’analogie ne doit pas être prise au pied de la lettre : un algorithme est une procédure formelle et structurée, pas nécessairement une liste de recettes ou de règles métier.` },
    { q: `Mise en situation : quelle rupture pédagogique introduit le machine learning ?`, opts: [`La disparition des données`, `L’abandon du calcul numérique`, `L’apprentissage de paramètres à partir d’exemples`, `La suppression des objectifs`], correct: 2, correctExpl: `Au lieu d’écrire toutes les règles de reconnaissance, on fournit notamment des données, une architecture et un objectif ; l’entraînement ajuste les paramètres du modèle.`, wrongExpl: `Le machine learning n’élimine ni les algorithmes ni les objectifs. Ce qui change, c’est qu’une partie du comportement est apprise à partir des données plutôt que codée règle par règle.` },
    { q: `Vérifions la notion : dans un réseau neuronal, qu’est-ce qu’un poids ?`, opts: [`Le nombre de couches`, `Une image d’entraînement`, `Une valeur réglant l’influence d’une connexion`, `La taille du fichier`], correct: 2, correctExpl: `Un poids est un paramètre numérique. Pendant l’entraînement, son ajustement modifie l’influence de certains signaux sur les calculs suivants.`, wrongExpl: `L’image du bouton de volume sert ici : on ne tourne pas physiquement un neurone. L’apprentissage ajuste des valeurs numériques, notamment les poids des connexions.` },
    { q: `Dans le schéma étudié : que signifie généraliser pour un modèle entraîné à reconnaître des chats ?`, opts: [`Répondre toujours « chat »`, `Créer automatiquement une règle écrite`, `Reconnaître aussi des chats jamais vus`, `Mémoriser exactement chaque image`], correct: 2, correctExpl: `La généralisation est la capacité à réussir sur de nouveaux exemples : autre couleur, autre angle, autre éclairage, etc.`, wrongExpl: `Mémoriser le jeu d’entraînement ne suffit pas. Un modèle utile doit transférer ce qu’il a appris à des situations nouvelles mais suffisamment proches du problème appris.` },
    { q: `Application concrète : quel est le rôle de la rétropropagation ?`, opts: [`Transformer les règles en faits`, `Choisir le prompt`, `Calculer comment l’erreur dépend des paramètres`, `Créer les données`], correct: 2, correctExpl: `La rétropropagation calcule efficacement comment les paramètres contribuent à l’erreur ; un optimiseur peut ensuite les ajuster pour réduire cette erreur.`, wrongExpl: `Ne la confonds pas avec l’ensemble de l’apprentissage. La rétropropagation fournit l’information nécessaire aux ajustements ; la descente de gradient ou un optimiseur utilise ensuite cette information.` },
    { q: `Mise en situation : pourquoi parle-t-on de « boîte noire » ?`, opts: [`Parce que le code est toujours secret`, `Parce que les serveurs sont fermés`, `Parce qu’une décision est difficile à traduire en règles humaines simples`, `Parce que personne ne connaît l’architecture`], correct: 2, correctExpl: `Dans un grand réseau, une sortie résulte de très nombreux paramètres et calculs distribués. On connaît l’architecture, mais expliquer une décision en quelques règles humaines peut être difficile.`, wrongExpl: `« Boîte noire » ne signifie pas « magie » ni « ignorance totale ». On sait construire et entraîner le modèle ; la difficulté concerne surtout l’interprétation fine de ses mécanismes et décisions.` },
    { q: `Vérifions la notion : qu’est-ce qu’un token dans un LLM ?`, opts: [`Un vecteur complet`, `Une phrase entière`, `Une unité de texte traitée par le modèle`, `Une probabilité`], correct: 2, correctExpl: `Le tokenizer découpe le texte en unités : mots, morceaux de mots, ponctuation ou autres fragments selon le vocabulaire du modèle.`, wrongExpl: `Un token n’est pas forcément un mot. Cette distinction est importante pour comprendre les limites de contexte, les coûts en tokens et la génération séquentielle.` },
    { q: `Dans le schéma étudié : dans « Bonjour, comment ça… », que fait le modèle avant de produire la suite ?`, opts: [`Il applique une règle grammaticale unique`, `Il choisit le mot le plus long`, `Il estime des probabilités sur les tokens suivants`, `Il recherche une phrase identique sur Internet`], correct: 2, correctExpl: `À partir du contexte, le modèle produit une distribution de probabilités sur les tokens possibles, puis le mécanisme de génération sélectionne la suite.`, wrongExpl: `Le modèle ne se contente ni d’une recherche exacte ni d’une règle unique. Sa prédiction dépend du contexte et des régularités apprises pendant l’entraînement.` },
    { q: `Application concrète : à quoi sert surtout l’expérience du sac de billes ?`, opts: [`À représenter les embeddings`, `À simuler le stockage`, `À rendre intuitive l’idée de probabilité conditionnelle`, `À expliquer les GPU`], correct: 2, correctExpl: `Les tirages successifs montrent comment de nouvelles observations peuvent modifier notre estimation. C’est une analogie pour introduire l’intuition probabiliste.`, wrongExpl: `Les tokens ne sont pas réellement mélangés dans un sac. L’expérience sert uniquement à donner une intuition de la mise à jour d’une estimation en fonction d’informations disponibles.` },
    { q: `Mise en situation : pourquoi le lapin en peluche et le lapin du chasseur donnent-ils des réponses différentes ?`, opts: [`Parce que le mot change d’orthographe`, `Parce que l’IA reconnaît le métier automatiquement`, `Parce que le contexte oriente l’interprétation`, `Parce que chaque sens possède un LLM différent`], correct: 2, correctExpl: `La même chaîne de mots peut prendre un sens différent selon son contexte. Les représentations et le mécanisme d’attention permettent au modèle d’exploiter ces relations.`, wrongExpl: `Le mot « lapin » reste identique. Ce sont les autres éléments du contexte — enfant, peluche, chasse, cuisine — qui orientent l’interprétation pertinente.` },
    { q: `Vérifions la notion : comment peut-on vulgariser un vecteur dans ce module ?`, opts: [`Comme une base de faits`, `Comme une liste de sites web`, `Comme des coordonnées sur une carte mathématique du sens`, `Comme une règle SI/ALORS`], correct: 2, correctExpl: `Un vecteur est une suite de nombres. L’image d’une carte multidimensionnelle aide à comprendre que des représentations peuvent encoder des relations apprises.`, wrongExpl: `Il ne faut pas imaginer un rayon nommé « doudou » ou « recette ». Les dimensions sont apprises et leur interprétation n’est généralement pas aussi directe.` },
    { q: `Dans le schéma étudié : que signifie le T de GPT ?`, opts: [`Training`, `Technology`, `Transformer`, `Token`], correct: 2, correctExpl: `GPT signifie Generative Pre-trained Transformer. Le Transformer est une architecture introduite en 2017 et fondée notamment sur des mécanismes d’attention.`, wrongExpl: `Le token est une unité de texte, et l’entraînement est une phase du développement du modèle, mais le T de l’acronyme GPT signifie bien Transformer.` },
    { q: `Application concrète : quel est le rôle intuitif de l’attention ?`, opts: [`Mesurer la puissance du GPU`, `Compresser les fichiers`, `Relier les éléments du contexte qui comptent pour le traitement`, `Créer les comptes utilisateurs`], correct: 2, correctExpl: `L’attention calcule des relations entre représentations afin de pondérer les informations pertinentes du contexte pour chaque position traitée.`, wrongExpl: `Dans l’exemple « l’enfant prend son lapin… avec lui », l’attention aide à exploiter les relations entre les mots plutôt que de traiter chaque token comme isolé.` },
    { q: `Mise en situation : qu’est-ce qui distingue surtout un agent IA d’un simple échange de chatbot ?`, opts: [`Il est toujours conscient`, `Il fonctionne sans modèle`, `Il peut enchaîner des actions et utiliser des outils vers un objectif`, `Il n’a besoin d’aucune autorisation`], correct: 2, correctExpl: `Un agent peut recevoir un objectif, choisir ou suivre des étapes, appeler des outils, observer leurs résultats puis poursuivre. Son autonomie reste encadrée par sa conception et ses permissions.`, wrongExpl: `Un agent n’est ni nécessairement autonome à 100 %, ni conscient. La différence utile ici est sa capacité à agir avec des outils et à enchaîner plusieurs étapes.` },
    { q: `Vérifions la notion : quelle ambition associe-t-on aux world models dans le module ?`, opts: [`Créer uniquement de la vidéo`, `Prédire seulement le prochain mot`, `Apprendre des représentations permettant d’anticiper l’évolution d’un environnement`, `Remplacer toutes les interfaces`], correct: 2, correctExpl: `Les world models cherchent notamment à représenter des dynamiques du monde : états, évolution, conséquences possibles d’actions, espace ou temporalité.`, wrongExpl: `L’enjeu va au-delà de la multimodalité ou du prochain token : il s’agit d’apprendre des représentations utiles pour anticiper ce qui pourrait se passer dans un environnement.` },
  ],
]

function FlowDiagram({ items, caption }: { items: { icon: string; title: string; text?: string }[]; caption?: string }) {
  return <div style={{ margin: '16px 0', padding: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16 }}>
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {items.map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <div style={{ minWidth: 105, flex: 1, padding: '12px 9px', borderRadius: 12, background: i % 2 ? 'var(--accent-bg)' : 'var(--bg2)', textAlign: 'center' }}>
          <div style={{ fontSize: 24 }}>{item.icon}</div><div style={{ fontSize: 12, fontWeight: 800, marginTop: 5 }}>{item.title}</div>
          {item.text && <div style={{ fontSize: 10.5, color: 'var(--text2)', lineHeight: 1.45, marginTop: 4 }}>{item.text}</div>}
        </div>
        {i < items.length - 1 && <div style={{ padding: '0 3px', fontWeight: 900, color: 'var(--accent)' }}>→</div>}
      </div>)}
    </div>{caption && <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, marginTop: 8 }}>💡 {caption}</div>}
  </div>
}

function PedagogyBox({ title, children, icon = '🔎' }: { title: string; children: React.ReactNode; icon?: string }) {
  return <div style={{ marginTop: 14, padding: 14, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 2px 0 rgba(0,0,0,.04)' }}>
    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>{icon} {title}</div>
    <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text2)' }}>{children}</div>
  </div>
}

function AIChipBadge({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 0 16px #534AB7)', animation: 'chipGlow 2s ease-in-out infinite' }}>
      <style>{`@keyframes chipGlow{0%,100%{filter:drop-shadow(0 0 8px #534AB7)}50%{filter:drop-shadow(0 0 24px #7F77DD)}}`}</style>
      <rect x="28" y="28" width="64" height="64" rx="8" fill="#1a1560" stroke="#534AB7" strokeWidth="2"/>
      <rect x="36" y="36" width="48" height="48" rx="4" fill="#0d0a40" stroke="#7F77DD" strokeWidth="1"/>
      {[[45,45],[60,45],[75,45],[45,60],[60,60],[75,60],[45,75],[60,75],[75,75]].map(([cx,cy],i)=>(<circle key={i} cx={cx} cy={cy} r="3" fill="#7F77DD"/>))}
      {[[45,45,60,45],[60,45,75,45],[45,60,60,60],[60,60,75,60],[45,75,60,75],[60,75,75,75],[45,45,45,60],[60,45,60,60],[75,45,75,60],[45,60,45,75],[60,60,60,75],[75,60,75,75],[45,45,60,60],[60,60,75,75]].map(([x1,y1,x2,y2],i)=>(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#534AB7" strokeWidth="0.8" opacity="0.7"/>))}
      <circle cx="60" cy="60" r="6" fill="#EEEDFE"/>
      <circle cx="60" cy="60" r="3" fill="white"/>
      {[38,50,62,74,86].map((x,i)=>[<rect key={`t${i}`} x={x} y="22" width="4" height="6" rx="1" fill="#5DCAA5"/>,<rect key={`b${i}`} x={x} y="92" width="4" height="6" rx="1" fill="#5DCAA5"/>])}
      {[38,50,62,74,86].map((y,i)=>[<rect key={`l${i}`} x="22" y={y} width="6" height="4" rx="1" fill="#5DCAA5"/>,<rect key={`r${i}`} x="92" y={y} width="6" height="4" rx="1" fill="#5DCAA5"/>])}
    </svg>
  )
}

function ProgressBar({ step, phase }: { step: number, phase: number }) {
  const pct = Math.round((step / (TOTAL_LEARNING + QUIZ_LENGTH)) * 100)
  const phases = ['💻','🧪','🔗','✨','🤖','❓']
  return (
    <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#534AB7,#5DCAA5)', borderRadius: 3, transition: 'width .4s' }}/>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 30 }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
            background: i < phase ? '#E1F5EE' : i === phase ? 'var(--accent)' : 'var(--bg2)',
            border: `2px solid ${i === phase ? 'var(--accent)' : 'transparent'}`,
          }} title={['Traditionnel','Experts','Neurones','Génératif','Maintenant','Quiz'][i]}>
            {i < phase ? '✓' : p}
          </div>
        ))}
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', full = true }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, variant?: 'primary' | 'secondary', full?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: full ? '100%' : 'auto', padding: '14px 20px', borderRadius: 12, border: 'none',
      background: disabled ? 'var(--bg2)' : variant === 'primary' ? 'var(--accent)' : 'var(--bg2)',
      color: disabled ? 'var(--text3)' : variant === 'primary' ? 'white' : 'var(--text)',
      fontWeight: 700, fontSize: 15, cursor: disabled ? 'default' : 'pointer', transition: 'all .2s'
    }}>{children}</button>
  )
}

function FeedbackBar({ correct, expl, onNext, last }: { correct: boolean, expl: string, onNext: () => void, last: boolean }) {
  const msgs = ['Exact !', 'Bien vu !', 'Parfait !', 'Tu as compris !']
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: correct ? '#E1F5EE' : '#FAECE7', borderTop: `2px solid ${correct ? '#5DCAA5' : '#F0997B'}`, padding: '14px 20px 22px', zIndex: 100 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: correct ? '#085041' : '#993C1D', marginBottom: 4 }}>
          {correct ? `✓ ${msgs[Math.floor(Math.random()*msgs.length)]}` : '✗ Pas tout à fait…'}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.65, color: correct ? '#0a6050' : '#7a2e10', marginBottom: 8 }}>{expl}</div><div style={{fontSize:11,lineHeight:1.5,opacity:.78,marginBottom:12}}>{correct ? 'À retenir : relie cette réponse au schéma ou à l’exemple vu juste avant.' : 'Conseil : relis le raisonnement, pas seulement la bonne lettre. Le prochain essai utilisera des formulations différentes.'}</div>
        <Btn onClick={onNext}>{last ? 'Voir mes résultats →' : 'Continuer →'}</Btn>
      </div>
    </div>
  )
}

function Wrap({ children, onNext, canNext = true, nextLabel = 'Continuer →' }: { children: React.ReactNode, onNext?: () => void, canNext?: boolean, nextLabel?: string }) {
  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 700, margin: '0 auto' }}>
      {children}
      {onNext && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px 16px 18px', background: 'var(--bg)', borderTop: '0.5px solid var(--border)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Btn onClick={onNext} disabled={!canNext}>{nextLabel}</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ children, color }: { children: React.ReactNode, color: string }) {
  return <div style={{ display: 'inline-block', background: color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>{children}</div>
}

export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // Learning state
  const [step, setStep] = useState(0)
  const [catStep, setCatStep] = useState(0)
  const [dogAnswer, setDogAnswer] = useState<boolean | null>(null)
  const [expertStep, setExpertStep] = useState(0)
  const [marbles, setMarbles] = useState<string[]>([])
  const [wordChoice, setWordChoice] = useState<number | null>(null)
  const [rabbitCtx, setRabbitCtx] = useState<number | null>(null)
  const [gptReveal, setGptReveal] = useState(0)

  // Quiz state
  const [quizVersion, setQuizVersion] = useState(0)
  const QUIZ = QUIZ_SETS[quizVersion]
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null))
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [showFb, setShowFb] = useState(false)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      setUserId(user.id)
      supabase.from('modules').select('titre').eq('id', id as string).single().then(({ data }) => {
        if (data) setModuleTitle(data.titre)
        setLoading(false)
      })
    })
  }, [id])

  const next = () => setStep(s => s + 1)

  const qIdx = step - TOTAL_LEARNING
  const isQuiz = step >= TOTAL_LEARNING && step < TOTAL_LEARNING + QUIZ.length
  const isResult = step >= TOTAL_LEARNING + QUIZ.length

  const phase = step < 2 ? 0 : step < 7 ? 0 : step < 12 ? 1 : step < 20 ? 2 : step < 28 ? 3 : step < 31 ? 4 : 5

  const pickAnswer = async (optIdx: number) => {
    if (answers[qIdx] !== null) return
    const correct = QUIZ[qIdx].correct === optIdx
    const na = [...answers]; na[qIdx] = optIdx; setAnswers(na)
    setFeedback(correct); setShowFb(true)
    if (correct) setScore(s => s + 1)
    if (step === TOTAL_LEARNING + QUIZ.length - 1 && !saved) {
      setSaved(true)
      const finalScore = score + (correct ? 1 : 0)
      await supabase.from('progressions').upsert({
        animateur_id: userId!, module_id: id,
        completed: finalScore === QUIZ.length,
        completed_at: finalScore === QUIZ.length ? new Date().toISOString() : null,
        attempts: 1,
      }, { onConflict: 'animateur_id,module_id' })
    }
  }

  const nextQuiz = () => { setShowFb(false); setFeedback(null); next() }

  if (loading) return <div className="container"><div className="empty"><p>Chargement…</p></div></div>

  const header = (
    <div style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)' }}>
        <a href="/formation/modules" style={{ fontSize: 13, color: 'var(--text2)' }}>← Modules</a>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleTitle}</span>
        <LanguageSwitch />
      </div>
      {!isResult && <ProgressBar step={step} phase={phase} />}
    </div>
  )

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (isQuiz) {
    const q = QUIZ[qIdx]
    const ua = answers[qIdx]
    const labels = ['A','B','C','D']
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {header}
        <div style={{ padding: '20px 16px 120px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>Version {quizVersion + 1}/3 &nbsp;·&nbsp; Question {qIdx + 1} / {QUIZ.length} &nbsp;·&nbsp; ✓ {score}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, i) => {
              const sel = ua === i, cor = i === q.correct, shown = ua !== null
              return (
                <button key={i} onClick={() => pickAnswer(i)} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 12, border: `2px solid ${!shown ? 'var(--border)' : cor ? '#5DCAA5' : sel ? '#F0997B' : 'var(--border)'}`,
                  background: !shown ? 'var(--bg)' : cor ? '#E1F5EE' : sel ? '#FAECE7' : 'var(--bg)',
                  cursor: shown ? 'default' : 'pointer', textAlign: 'left', animation: 'fadeIn .2s ease',
                }}>
                  <span style={{ minWidth: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, background: !shown ? 'var(--bg2)' : cor ? '#5DCAA5' : sel ? '#F0997B' : 'var(--bg2)', color: !shown ? 'var(--text2)' : (cor || sel) ? 'white' : 'var(--text2)' }}>{labels[i]}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>
        {showFb && <FeedbackBar correct={feedback!} expl={feedback ? q.correctExpl : q.wrongExpl} onNext={nextQuiz} last={qIdx === QUIZ.length - 1} />}
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (isResult) {
    const total = answers.filter((a, i) => a === QUIZ[i].correct).length
    const perfect = total === QUIZ.length
    const pct = Math.round((total / QUIZ.length) * 100)
    const wrongs = answers.map((a, i) => a !== QUIZ[i].correct ? i : -1).filter(x => x >= 0)
    const restart = () => { const nextVersion = (quizVersion + 1) % QUIZ_SETS.length; setQuizVersion(nextVersion); setStep(TOTAL_LEARNING); setAnswers(Array(QUIZ_LENGTH).fill(null)); setScore(0); setShowFb(false); setFeedback(null); setSaved(false) }
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes chipGlow{0%,100%{filter:drop-shadow(0 0 8px #534AB7)}50%{filter:drop-shadow(0 0 24px #7F77DD)}}`}</style>
        {header}
        <div style={{ padding: '24px 16px 40px', maxWidth: 700, margin: '0 auto' }}>
          {perfect ? (
            <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeIn .5s ease' }}>
              <div style={{ marginBottom: 12 }}><AIChipBadge size={96} /></div>
              <div style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 8, letterSpacing: 1 }}>BADGE DÉBLOQUÉ ✦</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>MAÎTRISE IA 🧠</h2>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>20 / 20 — 100 %</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>Parfait ! Tu maîtrises les fondamentaux des 4 âges de l'IA.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 80 ? '🎯' : '💪'}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>{total} / {QUIZ.length}</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{pct >= 80 ? 'Beau parcours ! Quelques notions méritent encore un peu d\'entraînement.' : pct >= 60 ? 'Bon début ! Revois les questions manquées pour progresser.' : 'Continue à apprendre ! Le module t\'attend pour une révision.'}</p>
            </div>
          )}
          {wrongs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Questions manquées :</div>
              {wrongs.map(i => (
                <div key={i} style={{ padding: 12, background: '#FAECE7', borderRadius: 10, border: '0.5px solid #F0997B', marginBottom: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Q{i+1}. {QUIZ[i].q.substring(0, 70)}…</div>
                  <div style={{ color: '#085041' }}>✓ {QUIZ[i].opts[QUIZ[i].correct]}</div>
                  {answers[i] !== null && <div style={{ color: '#993C1D', marginTop: 2 }}>✗ {QUIZ[i].opts[answers[i]!]}</div>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn onClick={restart}>Essayer un nouveau quiz →</Btn>
            <Btn variant="secondary" onClick={() => window.location.href = '/formation/modules'}>← Retour aux modules</Btn>
          </div>
        </div>
      </div>
    )
  }

  // ── LEARNING STEPS ──────────────────────────────────────────────────────────
  const s = step
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {header}

      {/* STEP 0 — Cover */}
      {s === 0 && <Wrap onNext={next} nextLabel="Commencer →">
        <div style={{ textAlign: 'center', padding: '12px 0', animation: 'fadeIn .4s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>💡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>Sans technologie,<br/>pas d'intelligence artificielle.</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>Comment sommes-nous passés d'ordinateurs auxquels il fallait expliquer précisément quoi faire à des IA capables de dialoguer, créer et générer ?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[['💻','Informatique traditionnelle'],['🧪','Systèmes experts'],['🔗','Réseaux de neurones'],['✨','IA générative'],['🤖','Et maintenant ?']].map(([icon,label],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'var(--bg)', borderRadius: 12, width: '100%', maxWidth: 280, border: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text3)' }}>Ces technologies coexistent et se combinent. Ce n'est pas une histoire linéaire.</p>
        </div>
      </Wrap>}

      {/* STEP 1 — Traditional computing intro */}
      {s === 1 && <Wrap onNext={next}>
        <Tag color="var(--accent-bg)"><span style={{ color: 'var(--accent-text)' }}>💻 ÂGE 1 — Informatique traditionnelle</span></Tag>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>« Dis-moi exactement quoi faire. »</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>Dans l'informatique traditionnelle, <strong>l'humain écrit les instructions</strong>. La machine les exécute fidèlement.</p>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: 'monospace', fontSize: 15, fontWeight: 600 }}>SI [condition] → ALORS [action]</div><FlowDiagram items={[{icon:'📥',title:'ENTRÉE',text:'une donnée : prix, nom, image…'},{icon:'⚙️',title:'RÈGLES',text:'instructions écrites par l’humain'},{icon:'📤',title:'SORTIE',text:'classement, calcul ou action'}]} caption="Le programme ne « devine » pas la règle : elle a été définie avant l’exécution." /><PedagogyBox title="Exemple concret : une fiche de paie" icon="🏢">Si le salaire brut est X et que telle règle de cotisation s’applique, le logiciel calcule le montant correspondant. Si la règle change, il faut modifier le programme ou son paramétrage.</PedagogyBox>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>À la fin du XIXe siècle, les machines à cartes perforées de Herman Hollerith montrent déjà comment mécaniser le tri et le comptage de grandes quantités d’informations. IBM, créée ensuite en 1911 sous le nom CTR puis renommée IBM en 1924, fera de ce traitement de l’information un cœur historique de son activité. Une bonne manière de comprendre l’informatique traditionnelle est donc : <strong>des données entrent, des instructions explicites les transforment, un résultat sort.</strong></p>
      </Wrap>}

      {/* STEP 2 — Cat decision tree */}
      {s === 2 && <Wrap onNext={catStep >= 3 ? next : undefined} canNext={catStep >= 3} nextLabel="Suite →">
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>🐱</div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Comment classer cet animal ?</h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Un système traditionnel construit un arbre de décision</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['A-t-il des poils ?','🔸'],['A-t-il des oreilles ?','🔸'],['A-t-il une queue ?','🔸'],['🐱 CHAT !','✅']].map(([q,icon],i)=> catStep > i ? (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: i===3?'#E1F5EE':'var(--bg2)', border: `1.5px solid ${i===3?'#5DCAA5':'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn .3s ease' }}>
              <span style={{ fontSize: i===3?15:14, fontWeight: i===3?700:500 }}>{q}</span><span style={{ fontSize: 16 }}>{icon}</span>
            </div>
          ) : null)}
        </div>
        {catStep < 3 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={()=>setCatStep(s=>s+1)}>OUI 👍</Btn>
            <Btn variant="secondary" onClick={()=>setCatStep(s=>s+1)}>NON 👎</Btn>
          </div>
        )}
        {catStep >= 3 && <div style={{ marginTop: 14, padding: 12, background: 'var(--accent-bg)', borderRadius: 10, fontSize: 13, color: 'var(--accent-text)' }}>💡 L'idée fondamentale : <strong>les règles ont été définies à l'avance par des humains.</strong></div>}
      </Wrap>}

      {/* STEP 3 — Binary */}
      {s === 3 && <Wrap onNext={next}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Le 0 et le 1</h3>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
          {[['0','courant ne passe pas','#1a1a18','white','#6B7280'],['1','courant passe','var(--accent)','white','#CECBF6']].map(([n,d,bg,c,dc],i)=>(
            <div key={i} style={{ textAlign: 'center', padding: '18px 28px', background: bg, color: c, borderRadius: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 900 }}>{n}</div>
              <div style={{ fontSize: 11, marginTop: 4, color: dc }}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 14, background: '#FAECE7', borderRadius: 12, border: '1px solid #F0997B', fontSize: 14, lineHeight: 1.6 }}>
          ⚠️ <strong>Important :</strong> le fonctionnement binaire (0/1) et un arbre de décision (oui/non) sont deux choses différentes. Un programme n'est pas obligatoirement un arbre binaire.
        </div>
      </Wrap>}

      {/* STEP 4 — Dog challenge */}
      {s === 4 && <Wrap onNext={dogAnswer!==null?next:undefined} canNext={dogAnswer!==null}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐶</div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Mini-défi</h3>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>On vient de construire un système pour reconnaître un chat. Si on lui présente un chien — <strong>fonctionne-t-il automatiquement ?</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Oui, forcément 😎','Pas forcément 🤔'].map((opt,i)=>(
            <button key={i} onClick={()=>setDogAnswer(i===1)} style={{ flex:1, padding:'14px 10px', borderRadius:12, border:`2px solid ${dogAnswer===(i===1)?'var(--accent)':'var(--border)'}`, background:dogAnswer===(i===1)?'var(--accent-bg)':'var(--bg)', cursor:'pointer', fontWeight:600, fontSize:13, color:'var(--text)' }}>{opt}</button>
          ))}
        </div>
        {dogAnswer!==null && <div style={{ marginTop:14, padding:14, background:'#E1F5EE', borderRadius:12, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>✓ Bien vu !</strong> Si une nouvelle situation n'a pas été anticipée par les règles, le système peut échouer. Les règles doivent être adaptées.</div>}
      </Wrap>}

      {/* STEP 5 — Advantages/limits */}
      {s === 5 && <Wrap onNext={next}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>À retenir</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ padding:14, background:'#E1F5EE', borderRadius:12, border:'1.5px solid #5DCAA5' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>👍</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#085041', marginBottom:4 }}>AVANTAGE</div>
            <div style={{ fontWeight:600, fontSize:15, color:'#085041', marginBottom:6 }}>Traçabilité</div>
            <div style={{ fontSize:12, color:'#0a6050', lineHeight:1.5 }}>Les règles sont explicites. On peut retracer le chemin ayant conduit au résultat.</div>
          </div>
          <div style={{ padding:14, background:'#FAECE7', borderRadius:12, border:'1.5px solid #F0997B' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>⚠️</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#993C1D', marginBottom:4 }}>LIMITE</div>
            <div style={{ fontWeight:600, fontSize:15, color:'#993C1D', marginBottom:6 }}>Complexité</div>
            <div style={{ fontSize:12, color:'#7a2e10', lineHeight:1.5 }}>Plus les situations se multiplient, plus écrire et maintenir toutes les règles devient difficile.</div>
          </div>
        </div>
      </Wrap>}

      {/* STEP 6 — Transition to expert systems */}
      {s === 6 && <Wrap onNext={next} nextLabel="Découvrir le 2e âge →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>💭</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si on mettait directement l'expertise humaine dans la machine ?</h3>
          <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>Plutôt que de programmer toutes les situations possibles, que se passerait-il si on formalisait le raisonnement d'un expert ?</p>
        </div>
      </Wrap>}

      {/* STEP 7 — Expert systems intro */}
      {s === 7 && <Wrap onNext={next}>
        <Tag color="#FAEEDA"><span style={{ color:'#633806' }}>🧪 ÂGE 2 — Années 1970-1980</span></Tag>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>« Mettons l'expert dans la machine. »</h2>
        <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7 }}>Un <strong>ingénieur de la connaissance</strong> rencontre un spécialiste — médecin, ingénieur, technicien — et transforme son expertise en connaissances exploitables par un ordinateur.</p>
      </Wrap>}

      {/* STEP 8 — Expert system builder */}
      {s === 8 && <Wrap onNext={expertStep>=3?next:undefined} canNext={expertStep>=3}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Construis le système expert</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Clique pour découvrir chaque composant</p>
        {[{title:'BASE DE RÈGLES',icon:'📋',body:'SI A + B → ALORS C · Les connaissances de l\'expert sous forme de règles.',bg:'#E6F1FB',tc:'#0C447C',bc:'#85B7EB'},
          {title:'BASE DE FAITS',icon:'📊',body:'Les informations sur la situation actuelle : résultats d\'analyses, observations, données.',bg:'#FAEEDA',tc:'#633806',bc:'#EF9F27'},
          {title:'MOTEUR D\'INFÉRENCE',icon:'⚙️',body:'Applique les règles aux faits disponibles pour déduire une conclusion.',bg:'#E1F5EE',tc:'#085041',bc:'#5DCAA5'}
        ].map((c,i)=>(
          <div key={i} style={{ marginBottom:10 }}>
            {expertStep>i ? (
              <div style={{ padding:14, borderRadius:12, background:c.bg, border:`1.5px solid ${c.bc}`, animation:'fadeIn .3s ease' }}>
                <div style={{ fontWeight:700, fontSize:12, color:c.tc, marginBottom:4 }}>{c.icon} {c.title}</div>
                <div style={{ fontSize:13, color:c.tc, lineHeight:1.5 }}>{c.body}</div>
              </div>
            ) : (
              <button onClick={()=>setExpertStep(s=>s+1)} style={{ width:'100%', padding:'14px', borderRadius:12, background:'var(--bg2)', border:'2px dashed var(--border)', cursor:'pointer', color:'var(--text2)', fontSize:13, fontWeight:500 }}>
                {['① Révéler la base de règles','② Révéler la base de faits','③ Révéler le moteur d\'inférence'][i]}
              </button>
            )}
          </div>
        ))}
        {expertStep>=3 && <><FlowDiagram items={[{icon:'📊',title:'FAITS',text:'Température : 39°C'},{icon:'📋',title:'RÈGLE',text:'SI fièvre élevée…'},{icon:'⚙️',title:'INFÉRENCE',text:'la règle est applicable'},{icon:'💡',title:'CONCLUSION',text:'hypothèse / action proposée'}]} caption="Le moteur n’invente pas l’expertise : il applique les connaissances formalisées dans sa base."/><PedagogyBox title="Pourquoi c’est différent d’un simple arbre ?">Le moteur peut enchaîner plusieurs règles : une première conclusion devient un nouveau fait, qui peut déclencher une autre règle. On obtient ainsi un raisonnement symbolique explicite.</PedagogyBox></>}
      </Wrap>}

      {/* STEP 9 — Algorithm recipe */}
      {s === 9 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', marginBottom:16 }}><div style={{ fontSize:44 }}>🍳</div></div>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10 }}>L'algorithme, c'est comme une recette</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>📖</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4 }}>RECETTE</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>Ingrédients + instructions → plat</div>
          </div>
          <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, textAlign:'center' }}>
            <div style={{ fontSize:22 }}>💻</div>
            <div style={{ fontWeight:600, fontSize:12, marginTop:4, color:'var(--accent-text)' }}>ALGORITHME</div>
            <div style={{ fontSize:11, color:'var(--accent-text)', marginTop:4 }}>Données + instructions → résultat</div>
          </div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:10, fontSize:12, color:'var(--text2)' }}>⚠️ C'est une analogie. Un algorithme est une <strong>procédure structurée pour résoudre un problème</strong>, pas littéralement une recette.</div>
      </Wrap>}

      {/* STEP 10 — Deep Blue */}
      {s === 10 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ fontSize:44, marginBottom:6 }}>♟️</div>
          <h3 style={{ fontSize:20, fontWeight:800 }}>Deep Blue vs Kasparov</h3>
          <div style={{ fontSize:22, fontWeight:300, color:'var(--text3)', margin:'4px 0' }}>1997</div>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>Deep Blue bat le champion du monde d'échecs. Ce n'était pas un système expert classique — il combinait recherche dans l'arbre des coups, fonctions d'évaluation et matériel spécialisé.</p>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <div style={{ flex:1, padding:12, background:'#E1F5EE', borderRadius:12, textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#085041' }}>Deep Blue aux échecs</div>
              <div style={{ fontSize:18, margin:'4px 0' }}>⭐⭐⭐⭐⭐</div>
            </div>
            <div style={{ flex:1, padding:12, background:'#FAECE7', borderRadius:12, textAlign:'center' }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#993C1D' }}>Deep Blue 🥞 crêpes</div>
              <div style={{ fontSize:14, margin:'6px 0', fontWeight:600, color:'#993C1D' }}>❌ Aucune compétence</div>
            </div>
          </div>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, fontSize:13, fontWeight:600, lineHeight:1.5 }}>Une machine peut être extraordinaire dans un domaine précis <em>sans</em> savoir faire autre chose.</div>
        </div>
      </Wrap>}

      {/* STEP 11 — Transition to neural networks */}
      {s === 11 && <Wrap onNext={next} nextLabel="Découvrir les réseaux →">
        <div style={{ textAlign:'center', padding:'20px 0', animation:'fadeIn .4s ease' }}>
          <div style={{ fontSize:36, marginBottom:14 }}>🤔</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Et si nous arrêtions de donner toutes les règles à la machine ?</h3>
          <p style={{ fontSize:16, color:'var(--accent)', fontWeight:700 }}>Et si elle pouvait apprendre ?</p>
        </div>
      </Wrap>}

      {/* STEP 12 — Neural networks intro + timeline */}
      {s === 12 && <Wrap onNext={next}>
        <Tag color="#E6F1FB"><span style={{ color:'#0C447C' }}>🔗 ÂGE 3 — Réseaux de neurones</span></Tag>
        <h2 style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>« Et si la machine apprenait ? »</h2>
        {[{y:'1943',t:'McCulloch & Pitts : premier modèle mathématique du neurone'},{y:'1956',t:'Atelier de Dartmouth — le champ de l\'IA se structure'},{y:'1957-58',t:'Rosenblatt développe le perceptron'},{y:'Ensuite…',t:'Développement progressif des réseaux neuronaux jusqu\'à aujourd\'hui'}].map(({y,t},i)=>(
          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ minWidth:56, padding:'3px 6px', background:'var(--accent-bg)', color:'var(--accent-text)', borderRadius:8, fontSize:10, fontWeight:700, textAlign:'center' }}>{y}</div>
            <div style={{ fontSize:13, color:'var(--text)', paddingTop:3, lineHeight:1.5 }}>{t}</div>
          </div>
        ))}
      </Wrap>}

      {/* STEP 13 — Brain vs network */}
      {s === 13 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, textAlign:'center' }}>Cerveau vs Réseau artificiel</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, textAlign:'center' }}><div style={{ fontSize:34, marginBottom:6 }}>🧠</div><div style={{ fontWeight:600, fontSize:12 }}>CERVEAU</div><div style={{ fontSize:11, color:'var(--text2)', marginTop:4, lineHeight:1.5 }}>Neurones biologiques + synapses</div></div>
          <div style={{ padding:14, background:'var(--accent-bg)', borderRadius:12, textAlign:'center' }}><div style={{ fontSize:34, marginBottom:6 }}>🔗</div><div style={{ fontWeight:600, fontSize:12, color:'var(--accent-text)' }}>RÉSEAU ARTIFICIEL</div><div style={{ fontSize:11, color:'var(--accent-text)', marginTop:4, lineHeight:1.5 }}>Unités mathématiques + connexions pondérées</div></div>
        </div>
        <div style={{ padding:14, background:'#FAECE7', borderRadius:12, border:'1.5px solid #F0997B', fontSize:13, lineHeight:1.6 }}>⚠️ <strong>Un réseau de neurones artificiels n'est PAS un cerveau miniature.</strong> C'est une architecture mathématique librement inspirée de certaines idées biologiques.</div>
      </Wrap>}

      {/* STEP 14 — Layers and weights */}
      {s === 14 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Couches et poids</h3>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginBottom:18, flexWrap:'wrap' }}>
          {['ENTRÉE','●●','●●','●●','SORTIE'].map((l,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
              {i>0&&<div style={{ color:'var(--text3)', fontSize:16 }}>→</div>}
              <div style={{ padding:'8px 6px', background:i===0||i===4?'var(--accent)':'var(--bg2)', color:i===0||i===4?'white':'var(--text)', borderRadius:8, fontSize:11, fontWeight:600, minWidth:40, textAlign:'center' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, background:'var(--bg2)', borderRadius:12 }}>
          <div style={{ fontSize:28 }}>🎚️</div>
          <div><div style={{ fontWeight:600, fontSize:14 }}>Les poids = boutons de réglage</div><div style={{ fontSize:13, color:'var(--text2)', marginTop:4, lineHeight:1.5 }}>Certains signaux ont plus d'influence. <strong>L'apprentissage ajuste ces poids</strong> pour réduire les erreurs.</div></div>
        </div>
      </Wrap>}

      {/* STEP 15 — Cat learning */}
      {s === 15 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>🎮 Apprenons à reconnaître un chat</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Le réseau fait des erreurs au début… puis il apprend !</p>
        {[{p:'CAMION',pct:72,ok:false},{p:'CHIEN',pct:58,ok:false},{p:'FÉLIN 🟠',pct:84,ok:false},{p:'CHAT ✅',pct:96,ok:true}].map((a,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:a.ok?'#E1F5EE':'var(--bg2)', border:`1.5px solid ${a.ok?'#5DCAA5':'var(--border)'}`, borderRadius:10, marginBottom:8, animation:'fadeIn .3s ease' }}>
            <span style={{ fontSize:18 }}>🐱</span>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>→ {a.p}</span>
                <span style={{ fontSize:11, color:'var(--text2)' }}>{a.pct}%</span>
              </div>
              <div style={{ height:4, background:'var(--bg3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${a.pct}%`, height:'100%', background:a.ok?'#5DCAA5':'var(--accent)', borderRadius:2 }}/>
              </div>
            </div>
            <span style={{ fontSize:14 }}>{a.ok?'✅':'❌'}</span>
          </div>
        ))}
        <FlowDiagram items={[{icon:'🐱',title:'EXEMPLE',text:'image étiquetée chat'},{icon:'🧠',title:'PRÉDICTION',text:'le réseau propose une classe'},{icon:'📏',title:'ERREUR',text:'écart avec la bonne réponse'},{icon:'🎚️',title:'AJUSTEMENT',text:'les poids évoluent'}]} caption="Cette boucle est répétée sur de très nombreux exemples. Le modèle ne reçoit pas une règle « un chat a des moustaches » : il ajuste des paramètres qui deviennent utiles pour la tâche."/><PedagogyBox title="À ne pas confondre : entraînement et utilisation" icon="🧪">Pendant l’entraînement, les poids sont ajustés. Une fois le modèle entraîné, lorsqu’on lui présente une nouvelle image pour obtenir une prédiction, on parle d’inférence : les poids appris sont alors utilisés pour calculer une réponse.</PedagogyBox>
      </Wrap>}

      {/* STEP 16 — Generalization */}
      {s === 16 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>La généralisation</h3>
        <p style={{ fontSize:14, color:'var(--text2)', marginBottom:14, lineHeight:1.6 }}>L'objectif n'est pas de reconnaître uniquement les images déjà vues. Le modèle doit <strong>généraliser à de nouvelles situations</strong>.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['🐈','Chat noir'],['🐈‍⬛','Chat de nuit'],['🐱','Chat de côté'],['😺','Chat stylisé']].map(([icon,label],i)=>(
            <div key={i} style={{ padding:'12px', background:'#E1F5EE', border:'1.5px solid #5DCAA5', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:26 }}>{icon}</div>
              <div style={{ fontSize:11, color:'#085041', marginTop:3 }}>{label}</div>
              <div style={{ fontSize:11, color:'#5DCAA5', fontWeight:700, marginTop:2 }}>CHAT ✓</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 17 — Big comparison */}
      {s === 17 && <Wrap onNext={next}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14, textAlign:'center' }}>Le grand changement</h3>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:10 }}>
          <div style={{ fontWeight:700, fontSize:12, color:'var(--text2)', marginBottom:8 }}>💻 INFORMATIQUE TRADITIONNELLE</div>
          <div style={{ fontSize:13 }}>👨‍💻 L'humain écrit les règles → 💻 La machine les applique</div>
        </div>
        <div style={{ textAlign:'center', fontSize:20, margin:'4px 0' }}>⚡</div>
        <div style={{ padding:14, background:'var(--accent-bg)', borderRadius:12, border:'1.5px solid var(--accent)' }}>
          <div style={{ fontWeight:700, fontSize:12, color:'var(--accent-text)', marginBottom:8 }}>🔗 MACHINE LEARNING</div>
          <div style={{ fontSize:13, color:'var(--accent-text)' }}>👨‍💻 Données + objectif → 🧠 Le réseau <strong>apprend ses propres paramètres</strong></div>
        </div>
      </Wrap>}

      {/* STEP 18 — Black box */}
      {s === 18 && <Wrap onNext={next}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ display:'inline-block', background:'#E1F5EE', padding:'10px 20px', borderRadius:12, marginBottom:12 }}><span style={{ fontSize:14, fontWeight:700, color:'#085041' }}>✨ LA CAPACITÉ D'APPRENDRE</span></div>
          <div style={{ fontSize:20, color:'#993C1D', fontWeight:700, marginBottom:8 }}>…mais une difficulté apparaît.</div>
          <div style={{ display:'inline-block', background:'#FAECE7', padding:'10px 20px', borderRadius:12, marginBottom:14 }}><span style={{ fontSize:14, fontWeight:700, color:'#993C1D' }}>🔲 L'EXPLICABILITÉ</span></div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:12, fontSize:13, lineHeight:1.6 }}>
          <div style={{ padding:10, background:'var(--bg)', borderRadius:8, marginBottom:10 }}>
            <div style={{ fontStyle:'italic' }}>« Pourquoi ma candidature a-t-elle été rejetée ? »</div>
            <div style={{ color:'var(--text3)', fontSize:11, marginTop:4 }}>Réponse : « Parce que le paramètre X28 vaut 0,728. »</div>
            <div style={{ color:'#993C1D', fontWeight:600, fontSize:11, marginTop:3 }}>❌ Pas une explication satisfaisante.</div>
          </div>
          Un grand réseau peut avoir des milliards de paramètres interconnectés. Traduire une décision en règles compréhensibles est très difficile. C'est pourquoi il existe un domaine entier consacré à l'<strong>explicabilité de l'IA</strong>.
        </div>
      </Wrap>}

      {/* STEP 19 — Generative AI acceleration */}
      {s === 19 && <Wrap onNext={next} nextLabel="Découvrir l'IA générative →">
        <div style={{ textAlign:'center', padding:'10px 0', animation:'fadeIn .4s ease' }}>
          {[['🌐','Internet'],['📚','Données massives'],['⚡','Puissance de calcul / GPU'],['🔀','Transformer (2017)'],['✨','IA GÉNÉRATIVE']].map(([icon,label],i)=>(
            <div key={i}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:i===4?'var(--accent)':'var(--bg2)', borderRadius:10, color:i===4?'white':'var(--text)', marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{icon}</span><span style={{ fontSize:13, fontWeight:i===4?700:400 }}>{label}</span>
              </div>
              {i<4&&<div style={{ color:'var(--text3)', fontSize:16, margin:'0 0 4px' }}>↓</div>}
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 20 — Gen AI intro */}
      {s === 20 && <Wrap onNext={next}>
        <Tag color="#FBEAF0"><span style={{ color:'#72243E' }}>✨ ÂGE 4 — IA Générative</span></Tag>
        <h2 style={{ fontSize:21, fontWeight:800, marginBottom:10 }}>La machine ne fait plus seulement reconnaître. Elle peut aussi <em>générer</em>.</h2>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, marginBottom:14 }}>L'IA générative existait avant ChatGPT. On se concentre ici sur les <strong>LLM — Large Language Models</strong> : de très grands réseaux entraînés sur d'immenses volumes de texte.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['🔤','TOKENS'],['📍','VECTEURS'],['👁️','ATTENTION'],['🎲','PROBABILITÉS']].map(([icon,label],i)=>(
            <div key={i} style={{ padding:'12px', background:'var(--bg2)', border:'1.5px dashed var(--border)', borderRadius:10, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:3 }}>{icon}</div><div style={{ fontSize:11, fontWeight:600, color:'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>
      </Wrap>}

      {/* STEP 21 — Tokens */}
      {s === 21 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🔤 Les tokens</h3>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Un token est l'unité élémentaire que le modèle manipule.</p>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>La phrase « Bonjour le monde ! » devient :</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['Bonjour',' le',' monde',' !'].map((t,i)=>(
              <div key={i} style={{ padding:'6px 12px', background:['var(--accent-bg)','#E1F5EE','#FAEEDA','#FAECE7'][i], color:['var(--accent-text)','#085041','#633806','#993C1D'][i], borderRadius:8, fontWeight:600, fontSize:14, fontFamily:'monospace' }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ padding:12, background:'var(--bg2)', borderRadius:10, fontSize:13, lineHeight:1.6 }}>Un token peut être un mot, une partie de mot, un signe de ponctuation… Le modèle génère du texte <strong>token après token</strong>.</div>
      </Wrap>}

      {/* STEP 22 — Marble bag */}
      {s === 22 && <Wrap onNext={marbles.length>=6?next:undefined} canNext={marbles.length>=6}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>🎲 Le sac de billes</h3>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>Pioche des billes pour comprendre les probabilités</p>
        <div style={{ textAlign:'center', padding:'18px', background:'var(--bg2)', borderRadius:14, marginBottom:14 }}>
          <div style={{ fontSize:44, marginBottom:6 }}>🎒</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Billes rouges 🔴 et vertes 🟢 à l'intérieur</div>
          {marbles.length<6 ? (
            <Btn onClick={()=>setMarbles(m=>[...m,'🔴'])} full={false}>Piocher ({6-marbles.length} restantes)</Btn>
          ) : <div style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>6 tirages effectués !</div>}
        </div>
        {marbles.length>0 && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:22, letterSpacing:4, marginBottom:8 }}>{marbles.join(' ')}</div>
            <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:13, lineHeight:1.6 }}>
              {marbles.length<6 ? 'Continue…' : `${marbles.filter(m=>m==='🔴').length} rouges sur 6 tirages. Ces observations modifient-elles ton estimation ? Oui ! C'est l'intuition de la probabilité conditionnelle.`}
            </div>
          </div>
        )}
        {marbles.length>=6 && <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text3)' }}>💡 Analogie pédagogique — un LLM ne met évidemment pas ses tokens dans un sac !</div>}
      </Wrap>}

      {/* STEP 23 — Word prediction */}
      {s === 23 && <Wrap onNext={wordChoice!==null?next:undefined} canNext={wordChoice!==null}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Bonjour, comment ça…</h3>
          <p style={{ fontSize:13, color:'var(--text2)' }}>Quel token suit naturellement ?</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{t:'🐘 éléphant',ok:false},{t:'👍 va',ok:true},{t:'💻 ordinateur',ok:false},{t:'🥫 mayonnaise',ok:false}].map((w,i)=>(
            <button key={i} onClick={()=>setWordChoice(i)} style={{
              padding:'14px 10px', borderRadius:12, fontWeight:600, fontSize:14, cursor:wordChoice===null?'pointer':'default',
              border:`2px solid ${wordChoice===null?'var(--border)':i===wordChoice&&w.ok?'#5DCAA5':i===wordChoice&&!w.ok?'#F0997B':w.ok&&wordChoice!==null?'#5DCAA5':'var(--border)'}`,
              background:wordChoice===null?'var(--bg)':i===wordChoice&&w.ok?'#E1F5EE':i===wordChoice&&!w.ok?'#FAECE7':w.ok&&wordChoice!==null?'#E1F5EE':'var(--bg)',
              color:'var(--text)'
            }}>{w.t}{wordChoice!==null&&w.ok&&' ✓'}</button>
          ))}
        </div>
        {wordChoice!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>À partir du contexte, le modèle calcule une distribution de probabilités sur les tokens susceptibles de suivre.</strong> Token après token, une phrase entière se construit.</div>}
      </Wrap>}

      {/* STEP 24 — Rabbit */}
      {s === 24 && <Wrap onNext={rabbitCtx!==null?next:undefined} canNext={rabbitCtx!==null}>
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🐰 Le défi du lapin</h3>
        <p style={{ fontSize:15, fontWeight:700, marginBottom:10, textAlign:'center' }}>« Qu'est-ce que je fais de mon lapin ? »</p>
        <p style={{ fontSize:13, color:'var(--text2)', marginBottom:12 }}>La réponse devrait être différente selon le contexte. Lequel ?</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[{icon:'👦🎄🧸',label:'Enfant + Noël + peluche',ctx:0},{icon:'🏹🐇🍳',label:'Chasseur + gibier + cuisine',ctx:1}].map(({icon,label,ctx})=>(
            <button key={ctx} onClick={()=>setRabbitCtx(ctx)} style={{ padding:'16px', borderRadius:12, border:`2px solid ${rabbitCtx===ctx?'var(--accent)':'var(--border)'}`, background:rabbitCtx===ctx?'var(--accent-bg)':'var(--bg2)', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:500 }}>{label}</div>
            </button>
          ))}
        </div>
        {rabbitCtx!==null && <div style={{ marginTop:14, padding:12, background:'#E1F5EE', borderRadius:10, fontSize:13, lineHeight:1.6, color:'#085041' }}><strong>Exact !</strong> Le même mot « lapin » n'est pas interprété de la même façon selon le contexte. C'est là qu'interviennent les vecteurs.</div>}
      </Wrap>}

      {/* STEP 25 — Vectors */}
      {s === 25 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>📍 Les vecteurs</h3>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:14 }}>Les tokens sont transformés en <strong>représentations numériques</strong> dans un espace à des centaines de dimensions.</p>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:10, textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>« Une immense carte mathématique du sens »</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {[['👦🎄🧸 lapin','#E6F1FB','#0C447C'],['🏹🐇🍳 lapin','#FAEEDA','#633806']].map(([l,bg,c],i)=>(
              <div key={i} style={{ padding:'6px 12px', background:bg, color:c, borderRadius:20, fontSize:13, fontWeight:600 }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text3)' }}>⚠️ Il n'existe pas un «vecteur doudou» préprogrammé. Ce sont des représentations mathématiques <em>apprises</em> par le modèle.</div>
      </Wrap>}

      {/* STEP 26 — GPT reveal */}
      {s === 26 && <Wrap onNext={gptReveal>=3?next:undefined} canNext={gptReveal>=3}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:34, fontWeight:900, letterSpacing:5 }}>GPT</h3>
          <p style={{ fontSize:12, color:'var(--text2)' }}>Clique pour révéler chaque lettre</p>
        </div>
        {[{l:'G',w:'Generative',d:'Le modèle génère du contenu'},{l:'P',w:'Pre-trained',d:'Pré-entraîné sur de très grandes quantités de données'},{l:'T',w:'Transformer',d:"L'architecture du modèle (2017)"}].map((item,i)=>(
          <div key={i} onClick={()=>gptReveal===i&&setGptReveal(i+1)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:gptReveal>i?'var(--accent-bg)':'var(--bg2)', border:`1.5px solid ${gptReveal>i?'var(--accent)':'var(--border)'}`, borderRadius:12, marginBottom:10, cursor:gptReveal===i?'pointer':'default' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:gptReveal>i?'var(--accent)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:gptReveal>i?'white':'var(--text3)', flexShrink:0 }}>{item.l}</div>
            {gptReveal>i ? <div><div style={{ fontWeight:700, fontSize:14, color:'var(--accent-text)' }}>{item.w}</div><div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{item.d}</div></div> : <div style={{ fontSize:13, color:'var(--text3)' }}>Appuie pour révéler</div>}
          </div>
        ))}
      </Wrap>}

      {/* STEP 27 — Attention */}
      {s === 27 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>👁️ L'Attention</h3>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:14 }}>Comment le modèle sait-il quelles parties du contexte sont importantes ?</p>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:14, fontStyle:'italic', fontSize:14, lineHeight:1.8 }}>
          « <span style={{ background:'#FAEEDA', padding:'0 3px', borderRadius:3 }}>L'enfant</span> prend <span style={{ background:'#E6F1FB', padding:'0 3px', borderRadius:3 }}>son lapin</span> avant d'aller dormir avec <strong style={{ background:'#EEEDFE', padding:'0 3px', borderRadius:3 }}>lui</strong>. »
        </div>
        <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, fontSize:13, lineHeight:1.6, color:'var(--accent-text)', marginBottom:10 }}>L'<strong>attention</strong> permet au modèle d'évaluer quelles parties du contexte sont les plus pertinentes entre elles pour comprendre «lui».</div>
        <FlowDiagram items={[{icon:'🔤',title:'TOKENS',text:'le texte est découpé'},{icon:'📍',title:'VECTEURS',text:'les unités deviennent des nombres'},{icon:'👁️',title:'ATTENTION',text:'le contexte est mis en relation'},{icon:'🎲',title:'PROBABILITÉS',text:'une suite est évaluée'}]} caption="Ce schéma est volontairement simplifié : dans un Transformer réel, ces opérations se répètent à travers de nombreuses couches et transformations."/><PedagogyBox title="Exemple concret" icon="🧩">Dans « La banque refuse le prêt car elle juge son dossier incomplet », le mot « elle » doit être relié à « la banque ». L’attention aide le modèle à exploiter ce type de dépendance contextuelle.</PedagogyBox>
      </Wrap>}

      {/* STEP 28 — Agents */}
      {s === 28 && <Wrap onNext={next}>
        <Tag color="#EAF3DE"><span style={{ color:'#27500A' }}>🤖 ET MAINTENANT ?</span></Tag>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>Chatbot vs Agent IA</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ padding:12, background:'var(--bg2)', borderRadius:12 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>💬</div><div style={{ fontWeight:700, fontSize:12, marginBottom:6 }}>CHATBOT</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>Question → Réponse<br/>Question → Réponse<br/><em>L'utilisateur dirige tout.</em></div>
          </div>
          <div style={{ padding:12, background:'#EAF3DE', borderRadius:12, border:'1.5px solid #97C459' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>🤖</div><div style={{ fontWeight:700, fontSize:12, color:'#27500A', marginBottom:6 }}>AGENT IA</div>
            <div style={{ fontSize:12, color:'#27500A', lineHeight:1.6 }}>Objectif → Plan → Outil → Action → Résultat → Suite…</div>
          </div>
        </div>
        <FlowDiagram items={[{icon:'🎯',title:'OBJECTIF',text:'Prépare mon rendez-vous'},{icon:'📅',title:'OUTIL 1',text:'consulte le calendrier'},{icon:'📁',title:'OUTIL 2',text:'cherche les documents'},{icon:'📝',title:'ACTION',text:'produit un brief'}]} caption="Un agent devient utile quand le modèle peut agir sur un environnement via des outils autorisés."/><div style={{ marginTop:10, padding:10, background:'var(--bg2)', borderRadius:10, fontSize:11, color:'var(--text2)', lineHeight:1.5 }}>Son niveau d'autonomie dépend de sa conception, des permissions accordées et des contrôles humains mis en place. Un agent n’est donc pas synonyme d’autonomie totale.</div>
      </Wrap>}

      {/* STEP 29 — World models */}
      {s === 29 && <Wrap onNext={next}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>🌍 World Models</h3>
        <div style={{ padding:14, background:'var(--bg2)', borderRadius:12, marginBottom:14, fontSize:14, fontWeight:700, textAlign:'center' }}>Comprendre énormément de textes suffit-il pour comprendre le monde ?</div>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:12 }}>Yann LeCun et d'autres défendent l'idée qu'un humain apprend aussi grâce à :</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          {[['👁️','Vision'],['🌍','Espace'],['⏱️','Temps'],['🧱','Physique'],['🤲','Interactions'],['➡️','Conséquences']].map(([icon,label])=>(
            <div key={label} style={{ padding:'5px 12px', background:'var(--bg2)', borderRadius:20, fontSize:12, display:'flex', gap:5, alignItems:'center' }}><span>{icon}</span><span>{label}</span></div>
          ))}
        </div>
        <div style={{ padding:12, background:'var(--accent-bg)', borderRadius:12, fontSize:13, lineHeight:1.6, color:'var(--accent-text)' }}>L'ambition : permettre à une machine d'anticiper <strong>l'évolution d'un environnement et les conséquences possibles d'une action</strong> — pas seulement prédire le prochain token.</div>
      </Wrap>}

      {/* STEP 30 — Summary */}
      {s === 30 && <Wrap onNext={next} nextLabel="Passer au quiz final →">
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:14, textAlign:'center' }}>Synthèse des 4 âges</h3>
        {[{icon:'💻',n:'1',t:'Informatique traditionnelle',b:"L'humain écrit les instructions. La machine les exécute.",bg:'#EEEDFE',c:'#3C3489'},
          {icon:'🧪',n:'2',t:'Systèmes experts',b:"L'humain formalise l'expertise en règles. Un moteur les applique.",bg:'#FAEEDA',c:'#633806'},
          {icon:'🔗',n:'3',t:'Réseaux de neurones',b:"La machine apprend ses paramètres à partir de données et d'un objectif.",bg:'#E6F1FB',c:'#0C447C'},
          {icon:'✨',n:'4',t:'IA générative',b:"De très grands réseaux génèrent de nouveaux contenus. Tokens + vecteurs + attention.",bg:'#FBEAF0',c:'#72243E'},
          {icon:'🤖',n:'→',t:"Aujourd'hui et demain",b:'Agents IA + world models + nouvelles architectures.',bg:'#EAF3DE',c:'#27500A'},
        ].map(({icon,n,t,b,bg,c})=>(
          <div key={n} style={{ display:'flex', gap:10, padding:'10px 12px', background:bg, borderRadius:12, marginBottom:8, alignItems:'flex-start' }}>
            <div style={{ minWidth:26, height:26, borderRadius:'50%', background:c, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
            <div><div style={{ fontWeight:700, fontSize:12, color:c }}>{icon} {t}</div><div style={{ fontSize:11, color:c, marginTop:3, lineHeight:1.5 }}>{b}</div></div>
          </div>
        ))}
      </Wrap>}
    </div>
  )
}
