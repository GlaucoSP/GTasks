import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissões de notificação
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Permissão de notificação negada');
      return false;
    }

    // Configurar canal de notificação no Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificações de Tarefas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
};

/**
 * Agenda notificações para uma tarefa
 */
export const scheduleTaskNotification = async (task) => {
  try {
    // Verificar permissões primeiro
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Sem permissão para notificações');
      return { success: false, error: 'NO_PERMISSION' };
    }

    // Cancelar notificações existentes para esta tarefa
    await cancelTaskNotifications(task.id);
    
    const now = new Date();
    const scheduledNotifications = [];

    // 1. Notificação para o prazo (deadline)
    const deadlineDate = new Date(task.deadline);
    // Agendar para 9h da manhã do dia do prazo
    deadlineDate.setHours(9, 0, 0, 0);
    
    if (deadlineDate > now) {
      const trigger = {
        date: deadlineDate,
      };

      try {
        const deadlineNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 Prazo da tarefa!',
            body: `A tarefa "${task.title}" vence hoje!`,
            data: { 
              taskId: task.id,
              type: 'deadline',
              screen: 'Home',
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger,
        });

        scheduledNotifications.push({
          id: deadlineNotificationId,
          type: 'deadline',
          date: deadlineDate,
        });

        console.log(`✅ Notificação de prazo agendada: ${deadlineNotificationId}`);
      } catch (error) {
        console.error('Erro ao agendar notificação de prazo:', error);
      }
    } else {
      console.log('⚠️ Data do prazo já passou, notificação não agendada');
    }

    // 2. Notificação personalizada (reminder)
    if (task.remindAt) {
      const reminderDate = new Date(task.remindAt);
      
      if (reminderDate > now) {
        const trigger = {
          date: reminderDate,
        };

        try {
          const reminderNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔔 Lembrete de tarefa',
              body: task.description 
                ? `${task.title}\n${task.description}` 
                : task.title,
              data: { 
                taskId: task.id,
                type: 'reminder',
                screen: 'Home',
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger,
          });

          scheduledNotifications.push({
            id: reminderNotificationId,
            type: 'reminder',
            date: reminderDate,
          });

          console.log(`✅ Lembrete agendado: ${reminderNotificationId}`);
        } catch (error) {
          console.error('Erro ao agendar lembrete:', error);
        }
      } else {
        console.log('⚠️ Data do lembrete já passou, notificação não agendada');
      }
    }

    // 3. Notificação de lembrete 1 dia antes (se o prazo for > 1 dia)
    const oneDayBefore = new Date(deadlineDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(18, 0, 0, 0); // 18h do dia anterior
    
    if (oneDayBefore > now) {
      const trigger = {
        date: oneDayBefore,
      };

      try {
        const beforeNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Lembrete: Tarefa vence amanhã!',
            body: `Não esqueça: "${task.title}" vence amanhã.`,
            data: { 
              taskId: task.id,
              type: 'before_deadline',
              screen: 'Home',
            },
            sound: 'default',
          },
          trigger,
        });

        scheduledNotifications.push({
          id: beforeNotificationId,
          type: 'before_deadline',
          date: oneDayBefore,
        });

        console.log(`✅ Notificação 1 dia antes agendada: ${beforeNotificationId}`);
      } catch (error) {
        console.error('Erro ao agendar notificação 1 dia antes:', error);
      }
    }

    return {
      success: true,
      notifications: scheduledNotifications,
      count: scheduledNotifications.length,
    };

  } catch (error) {
    console.error('Erro geral ao agendar notificações:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Cancela todas as notificações de uma tarefa
 */
export const cancelTaskNotifications = async (taskId) => {
  try {
    // Obter todas as notificações agendadas
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Filtrar notificações desta tarefa
    const taskNotifications = scheduledNotifications.filter(
      notification => notification.content.data?.taskId === taskId
    );

    // Cancelar cada uma
    const cancelPromises = taskNotifications.map(notification =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    );

    await Promise.all(cancelPromises);
    
    console.log(`✅ ${taskNotifications.length} notificação(ões) cancelada(s) para tarefa ${taskId}`);
    
    return {
      success: true,
      canceledCount: taskNotifications.length,
    };
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Cancela todas as notificações do app
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Todas as notificações foram canceladas');
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar todas as notificações:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lista todas as notificações agendadas (útil para debug)
 */
export const listScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    
    console.log(`📋 Total de notificações agendadas: ${notifications.length}`);
    
    notifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. ID: ${notification.identifier}`);
      console.log(`   Título: ${notification.content.title}`);
      console.log(`   Data: ${new Date(notification.trigger.value).toLocaleString('pt-BR')}`);
      console.log(`   TaskId: ${notification.content.data?.taskId}`);
      console.log(`   Tipo: ${notification.content.data?.type}`);
    });
    
    return notifications;
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return [];
  }
};

/**
 * Verifica o status das permissões
 */
export const checkNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      status,
    };
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return {
      granted: false,
      status: 'error',
    };
  }
};

export default {
  requestNotificationPermissions,
  scheduleTaskNotification,
  cancelTaskNotifications,
  cancelAllNotifications,
  listScheduledNotifications,
  checkNotificationPermissions,
};