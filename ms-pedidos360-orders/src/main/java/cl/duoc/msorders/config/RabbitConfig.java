package cl.duoc.msorders.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitConfig {

    @Value("${rabbitmq.exchanges.direct:cmd.direct}")
    private String directExchangeName;

    @Value("${rabbitmq.exchanges.dlx:cmd.dead.dlx}")
    private String dlxExchangeName;

    @Value("${rabbitmq.queues.email:q.cmd.email}")
    private String emailQueueName;

    @Value("${rabbitmq.queues.email-dlq:q.cmd.email.dlq}")
    private String emailDlqName;

    @Value("${rabbitmq.routing-keys.email:email.send}")
    private String emailRoutingKey;

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // Registrar explícitamente el RabbitAdmin
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(directExchangeName);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxExchangeName);
    }

    @Bean
    public Queue emailDlq() {
        return QueueBuilder.durable(emailDlqName).build();
    }

    @Bean
    public Queue emailQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", dlxExchangeName);
        args.put("x-dead-letter-routing-key", emailRoutingKey);
        return QueueBuilder.durable(emailQueueName)
                .withArguments(args)
                .build();
    }

    @Bean
    public Binding emailBinding() {
        return BindingBuilder.bind(emailQueue())
                .to(directExchange())
                .with(emailRoutingKey);
    }

    @Bean
    public Binding emailDlqBinding() {
        return BindingBuilder.bind(emailDlq())
                .to(deadLetterExchange())
                .with(emailRoutingKey);
    }
}